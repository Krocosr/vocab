import { getEntry, putEntry } from './db.js';

export interface Definition {
  text: string;
  example: string | null;
  synonyms: string[];
  antonyms: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface WordEntry {
  word: string;
  phonetic: string | null;
  audioUrl: string | null;
  origin: string | null;
  formOf: { kind: string; word: string } | null;
  related: string[];
  meanings: Meaning[];
  sourceUrls: string[];
  fetchedAt: string;
}

export class WordNotFound extends Error {
  constructor(public suggestion: string | null) {
    super('word not found');
  }
}

const HEADERS = { 'User-Agent': 'vocab-selfhosted/1.0 (self-hosted dictionary)' };
// ponytail: a Wiktionary request that is backing off from a 429 can legitimately
// take 20-30s to be served, so the timeout must clear that or a rate-limited
// (but healthy) host looks dead.
const TIMEOUT = 30_000;
const DICTAPI_TIMEOUT = 4000;
const MAX_DEFS_PER_POS = 6;
const MAX_SYNONYMS = 8;
const MAX_ETYMOLOGY = 1500;
const MAX_RELATED = 12;
const MAX_PREFETCH = 5;
// dictionaryapi.dev is a nice-to-have fast path, not the source of truth.
// When it is cooling down we go straight to Wiktionary rather than paying a
// doomed attempt whose error would otherwise mask the real Wiktionary failure.
const dictApiUsable = () => Date.now() >= dictApiDownUntil;
// ponytail: dictionaryapi.dev outages last days, not minutes. Each failure
// doubles the cooldown (5min -> 6h cap) so a dead host costs one timeout per
// window instead of one per lookup; a single success resets it.
const DICTAPI_COOLDOWN_BASE = 5 * 60_000;
const DICTAPI_COOLDOWN_MAX = 6 * 60 * 60_000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ponytail: Wiktionary 429s under sustained load. The failure mode is a burst
// (suggest-per-keystroke + lookups + prefetch) tripping the limiter, after
// which every request fails. Two defences: space every request start well
// enough that a normal session stays under the limit, and on a 429 respect
// Retry-After and back off hard so a single 429 does not become a dead app.
const WIKI_SPACING = 900;
const WIKI_MAX_ATTEMPTS = 4;
let wiktNextAt = 0;
const pace = async () => {
  const wait = Math.max(0, wiktNextAt - Date.now());
  wiktNextAt = Math.max(Date.now(), wiktNextAt) + WIKI_SPACING;
  if (wait) await sleep(wait);
};

const retryAfterMs = (res: Response) => {
  const header = res.headers.get('retry-after');
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.min(Math.max(at - Date.now(), 1000), 30_000);
};

async function fetchRes(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await pace();
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
    if (res.status !== 429 || attempt === WIKI_MAX_ATTEMPTS - 1) return res;
    const backoff = retryAfterMs(res) ?? Math.min(2000 * 2 ** attempt, 30_000);
    console.error(`[wiki] 429 on ${new URL(url).pathname.slice(0, 60)} — waiting ${backoff}ms`);
    await sleep(backoff);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetchRes(url);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

// ponytail: upstream JSON is untrusted input, so each boundary narrows with a
// type guard instead of a cast. Shapes are the smallest ones actually read.
const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;

const asArray = (v: unknown): unknown[] => Array.isArray(v) ? v : [];

const asString = (v: unknown): string => typeof v === 'string' ? v : '';

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function htmlToText(html: string): string {
  const noBlocks = html
    .replace(/<(style|script|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  return decodeEntities(noBlocks.replace(/<[^>]+>/g, ' '))
    .replace(/\[\s*(edit|\d+)\s*\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?»”])/g, '$1')
    .replace(/([«“])\s+/g, '$1')
    .trim();
}

// ponytail: prose lives in <p>; etymology trees/navboxes are div+ul — skipping
// non-<p> content drops them without a DOM parser. Upgrade to cheerio if needed.
const paragraphText = (html: string) =>
  (html.match(/<p\b[\s\S]*?<\/p>/gi) ?? [])
    .map(p => htmlToText(p))
    .filter(Boolean)
    .join(' ');

const sectionLinks = (html: string): string[] =>
  [...new Set(
    [...html.matchAll(/href="\/wiki\/([^"#:]+)["#]/g)]
      .map(m => decodeURIComponent(m[1]).replace(/_/g, ' '))
  )];

const FORMOF_RE = /^((?:plural|singular|past tense|past participle|present participle|third-person singular|simple past|comparative|superlative|diminutive|augmentative|clipping|shortened|abbreviation|initialism|acronym|alternative|obsolete|archaic|dated|nonstandard|misspelled|misspelling|eye-dialect|pronunciation spelling|inflected|inflection)[\w\s-]*?) of ([\w][\w' -]+?)\s*(?:[.,;:)\[\-]|$)/i;

export const detectFormOf = (text: string): { kind: string; word: string } | null => {
  const m = text.match(FORMOF_RE);
  return m ? { kind: m[1].trim(), word: m[2].trim().toLowerCase() } : null;
};

/* ---------- wiktionary ---------- */

const wiktApi = 'https://en.wiktionary.org';
const enc = encodeURIComponent;

async function fetchPageHtml(word: string): Promise<string> {
  const res = await fetchJson(`${wiktApi}/w/api.php?action=parse&page=${enc(word)}&prop=text&format=json&formatversion=2`);
  return asString(asRecord(asRecord(res)?.parse)?.text);
}

// slice full Parsoid HTML into named sections by heading ids
function sliceSections(html: string): Map<string, string> {
  const heads = [...html.matchAll(/<div class="mw-heading[^"]*"><h[1-6][^>]*?id="([^"]+)"[^>]*>/g)];
  const map = new Map<string, string>();
  heads.forEach((m, i) => {
    const end = heads[i + 1]?.index ?? html.length;
    map.set(decodeEntities(m[1]).replace(/_/g, ' '), html.slice(m.index, end));
  });
  return map;
}

async function wiktionaryExtras(word: string, pageHtml: string) {
  const sections = sliceSections(pageHtml);
  let origin: string | null = null;
  for (const [name, html] of sections) {
    if (/^Etymology/.test(name)) {
      origin = paragraphText(html).slice(0, MAX_ETYMOLOGY) || null;
      break;
    }
  }
  const related = [...sections.entries()]
    .filter(([name]) => /^(Derived|Related) terms|^See also/i.test(name))
    .flatMap(([, html]) => sectionLinks(html))
    .map(w => w.trim())
    .filter(w => w && w.toLowerCase() !== word && !w.includes('/'));
  return { origin, related: [...new Set(related)].slice(0, MAX_RELATED) };
}

function normalizeWiktionary(data: unknown, word: string): Pick<WordEntry, 'meanings'> {
  const root = asRecord(data);
  const english = asArray(root?.en ?? (root ? Object.values(root)[0] : undefined));
  const meanings: Meaning[] = english
    .map(asRecord)
    .filter((m): m is Record<string, unknown> => !!m && asArray(m.definitions).length > 0)
    .map(m => ({
      partOfSpeech: asString(m.partOfSpeech).toLowerCase(),
      definitions: asArray(m.definitions).slice(0, MAX_DEFS_PER_POS).map(asRecord).map(d => ({
        text: htmlToText(asString(d?.definition)),
        example: d && asArray(d.examples).length
          ? htmlToText(asString(asRecord(asArray(d.examples)[0])?.example))
          : null,
        synonyms: [],
        antonyms: [],
      })),
    }));
  return { meanings };
}

async function fromWiktionary(word: string): Promise<WordEntry> {
  const t0 = Date.now();
  // Definitions first, alone: they are what the user is waiting on. The page
  // HTML (etymology + related) is a second request to the same rate-limited
  // host, so it is fetched in the background and patched into the cache.
  const defRes = await fetchRes(`${wiktApi}/api/rest_v1/page/definition/${enc(word)}`);
  if (defRes.status === 404) throw new WordNotFound(null);
  if (!defRes.ok) throw new Error(`wiktionary ${defRes.status}`);

  const { meanings } = normalizeWiktionary(await defRes.json(), word);
  if (!meanings.length) throw new WordNotFound(null);
  console.error(`[wikt] ${word} fetch=${Date.now() - t0}ms (extras deferred)`);

  const entry: WordEntry = {
    word,
    phonetic: null,
    audioUrl: null,
    origin: null,
    formOf: detectFormOf(meanings[0].definitions[0]?.text ?? ''),
    related: [],
    meanings,
    sourceUrls: [`${wiktApi}/wiki/${enc(word)}`],
    fetchedAt: new Date().toISOString(),
  };
  void fillExtras(word, entry);
  return entry;
}

// background etymology/related enrichment; silently gives up on failure
async function fillExtras(word: string, entry: WordEntry) {
  const pageHtml = await fetchPageHtml(word).catch(() => '');
  if (!pageHtml) return;
  const extras = await wiktionaryExtras(word, pageHtml);
  const latest = getEntry(word);
  if (!latest) return; // replaced or removed while we were working
  const current = JSON.parse(latest.payload) as WordEntry;
  const merged: WordEntry = {
    ...current,
    origin: current.origin ?? extras.origin,
    related: current.related?.length ? current.related : extras.related,
  };
  putEntry(word, JSON.stringify(merged));
  entry.origin = merged.origin;
  entry.related = merged.related;
}

/* ---------- dictionaryapi ---------- */

export function normalizeDictionaryApi(entries: unknown, query: string): WordEntry {
  const records = asArray(entries).map(asRecord).filter((e): e is Record<string, unknown> => !!e);
  const meanings: Meaning[] = [];
  for (const e of records) {
    for (const m of asArray(e.meanings).map(asRecord)) {
      if (!m) continue;
      const partOfSpeech = asString(m.partOfSpeech);
      const existing = meanings.find(x => x.partOfSpeech === partOfSpeech);
      const bucket = existing ?? meanings[meanings.push({ partOfSpeech, definitions: [] }) - 1];
      for (const d of asArray(m.definitions).map(asRecord)) {
        if (!d) continue;
        if (bucket.definitions.length >= MAX_DEFS_PER_POS) break;
        if (bucket.definitions.some(x => x.text === asString(d.definition))) continue;
        bucket.definitions.push({
          text: asString(d.definition),
          example: typeof d.example === 'string' && d.example ? d.example : null,
          synonyms: asArray(d.synonyms).filter(s => typeof s === 'string').slice(0, MAX_SYNONYMS) as string[],
          antonyms: asArray(d.antonyms).filter(s => typeof s === 'string').slice(0, MAX_SYNONYMS) as string[],
        });
      }
    }
  }

  const phonetics = records.flatMap(e => asArray(e.phonetics).map(asRecord));
  const phonetic =
    asString(records.find(e => e.phonetic)?.phonetic) ||
    asString(phonetics.find(p => p?.text)?.text) || null;

  const rawAudio = asString(phonetics.find(p => p?.audio)?.audio);
  const audioUrl = rawAudio ? (rawAudio.startsWith('//') ? `https:${rawAudio}` : rawAudio) : null;

  const origin = asString(records.find(e => e.origin)?.origin) || null;
  const sourceUrls = [...new Set(records.flatMap(e => asArray(e.sourceUrls).filter(u => typeof u === 'string')))];

  return {
    word: asString(records[0]?.word) || query,
    phonetic, audioUrl, origin, formOf: null, related: [], meanings,
    sourceUrls: sourceUrls as string[],
    fetchedAt: new Date().toISOString(),
  };
}

// ponytail: dictionaryapi.dev goes down for days; after a network failure we skip
// it for 5 min instead of paying an 8s timeout on every lookup. Refresh on success.
let dictApiDownUntil = 0;
let dictApiCooldown = DICTAPI_COOLDOWN_BASE;

const markDictApiDown = () => {
  dictApiCooldown = Math.min(dictApiCooldown * 2, DICTAPI_COOLDOWN_MAX);
  dictApiDownUntil = Date.now() + dictApiCooldown;
  console.error(`[probe] dictionaryapi.dev down — skipping ${Math.round(dictApiCooldown / 60000)}min`);
};

const markDictApiUp = () => { dictApiCooldown = DICTAPI_COOLDOWN_BASE; };

// boot probe: learn dictapi's reachability once, with a short timeout, so the
// first real lookup doesn't pay the full timeout on a dead host.
export function probeDictApi() {
  void fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/test`, {
    headers: HEADERS, signal: AbortSignal.timeout(2500),
  }).then(res => {
    if (!res.ok && res.status !== 404) markDictApiDown();
    else markDictApiUp();
    console.error(`[probe] dictionaryapi.dev ${res.ok || res.status === 404 ? 'up' : 'down'}`);
  }).catch(() => {
    markDictApiDown();
  });
}

async function fromDictionaryApi(word: string): Promise<WordEntry> {
  if (Date.now() < dictApiDownUntil) throw new Error('dictionaryapi cooldown');
  let res: Response;
  try {
    res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${enc(word)}`, {
      headers: HEADERS, signal: AbortSignal.timeout(DICTAPI_TIMEOUT),
    });
  } catch (e) {
    markDictApiDown();
    throw e;
  }
  if (res.status === 404) throw new WordNotFound(null);
  if (!res.ok) {
    markDictApiDown();
    throw new Error(`dictionaryapi ${res.status}`);
  }
  markDictApiUp();

  const entry = normalizeDictionaryApi(await res.json(), word);
  const pageHtml = await fetchPageHtml(word).catch(() => '');
  const extras = await wiktionaryExtras(word, pageHtml);
  if (!entry.origin) entry.origin = extras.origin;
  entry.related = extras.related;
  entry.formOf = detectFormOf(entry.meanings[0]?.definitions[0]?.text ?? '');
  return entry;
}

/* ---------- public ---------- */

// typed prefixes repeat constantly; a short TTL cache saves the opensearch call
const suggestCache = new Map<string, { at: number; words: string[] }>();

export async function suggest(q: string): Promise<string[]> {
  const hit = suggestCache.get(q);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.words;
  const res = await fetchJson(
    `${wiktApi}/w/api.php?action=opensearch&search=${enc(q)}&limit=8&namespace=0&format=json`);
  const words: string[] = asArray(asArray(res)[1]).filter((w): w is string => typeof w === 'string');
  if (suggestCache.size > 500) suggestCache.clear();
  suggestCache.set(q, { at: Date.now(), words });
  return words;
}
// prefetch is best-effort; pace it well below the interactive path so a burst
// of speculative work never starves a real lookup.
const PREFETCH_PACE = 2500;


export async function fetchWord(raw: string, depth = 0): Promise<WordEntry> {
  const word = raw.toLowerCase().trim();
  const t0 = Date.now();

  // stale-while-revalidate: any cached payload is better than an error, even an
  // older one missing `related`. We revalidate in the background and let the
  // next lookup pick up the fresher entry.
  const cached = getEntry(word);
  const cachedEntry = cached ? (JSON.parse(cached.payload) as WordEntry) : null;
  if (cachedEntry && 'related' in cachedEntry) {
    console.error(`[lookup] ${word} ${Date.now() - t0}ms (cache)`);
    return cachedEntry;
  }
  if (cachedEntry) {
    console.error(`[lookup] ${word} ${Date.now() - t0}ms (stale cache)`);
    void revalidate(word);
    return cachedEntry;
  }

  const { entry, source } = await fetchFresh(word);

  putEntry(word, JSON.stringify(entry));
  console.error(`[lookup] ${word} ${Date.now() - t0}ms (${source})`);

  // ponytail: depth-1 prefetch, serial + paced — predictive cache for link
  // navigation without hammering wiktionary's rate limit.
  if (depth === 0) {
    for (const rel of [entry.formOf?.word, ...entry.related].slice(0, MAX_PREFETCH)) {
      if (rel) prefetchQueue.add(rel);
    }
    void drainPrefetch();
  }
  return entry;
}

// background upgrade of a stale cache row; failures are silent by design
function revalidate(word: string) {
  if (revalidating.has(word)) return;
  revalidating.add(word);
  void (async () => {
    try {
      const fresh = await fetchFresh(word);
      putEntry(word, JSON.stringify(fresh.entry));
    } catch { /* stale row stays; next lookup retries */ }
    finally { revalidating.delete(word); }
  })();
}

const revalidating = new Set<string>();

async function fetchFresh(word: string): Promise<{ entry: WordEntry; source: string }> {
  let primaryErr: Error | null = null;
  if (dictApiUsable()) {
    try {
      return { entry: await fromDictionaryApi(word), source: 'dictapi' };
    } catch (e) {
      // A 404 here is a real "no such word" only if Wiktionary agrees; treat it
      // as a primary-source failure and let the fallback decide.
      primaryErr = e as Error;
    }
  }
  try {
    return { entry: await fromWiktionary(word), source: 'wiktionary' };
  } catch (fallbackErr) {
    if (fallbackErr instanceof WordNotFound) {
      const suggestions = await suggest(word).catch(() => [] as string[]);
      throw new WordNotFound(suggestions[0] ?? null);
    }
    throw primaryErr
      ? new Error(`${primaryErr.message} | wiktionary: ${(fallbackErr as Error).message}`)
      : fallbackErr;
  }
}


const prefetchQueue = new Set<string>();
let prefetching = false;

async function drainPrefetch() {
  if (prefetching) return;
  prefetching = true;
  try {
    while (prefetchQueue.size) {
      const w = prefetchQueue.values().next().value as string;
      prefetchQueue.delete(w);
      await fetchWord(w, 1).catch(() => {});
      await sleep(PREFETCH_PACE);
    }
  } finally {
    // A throw must not wedge the queue shut for the rest of the process.
    prefetching = false;
  }
}
