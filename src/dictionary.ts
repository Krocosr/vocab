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
  language: string | null;
}

export class WordNotFound extends Error {
  constructor(public suggestion: string | null) {
    super('word not found');
  }
}

const HEADERS = { 'User-Agent': 'vocab-selfhosted/1.0 (self-hosted dictionary)' };
const TIMEOUT = 8000;
const DICTAPI_TIMEOUT = 4000;
const MAX_DEFS_PER_POS = 6;
const MAX_SYNONYMS = 8;
const MAX_ETYMOLOGY = 1500;
const MAX_RELATED = 12;
const MAX_PREFETCH = 5;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ponytail: Wiktionary 429s under bursts (suggest-per-keystroke + lookups +
// prefetch). Pace request starts ~400ms apart and retry a 429 twice with
// backoff before giving up.
let wiktNextAt = 0;
const pace = async () => {
  const wait = Math.max(0, wiktNextAt - Date.now());
  wiktNextAt = Math.max(Date.now(), wiktNextAt) + 400;
  if (wait) await sleep(wait);
};

async function fetchRes(url: string): Promise<Response> {
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    await pace();
    res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
    if (res.status !== 429 || attempt === 2) return res;
    await sleep(1500 * (attempt + 1));
  }
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetchRes(url);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

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
  return res?.parse?.text ?? '';
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

function normalizeWiktionary(data: any, word: string): Pick<WordEntry, 'meanings' | 'language'> {
  const english = data.en ?? Object.values(data)[0] as any[];
  const meanings: Meaning[] = (english ?? [])
    .filter((m: any) => m.definitions?.length)
    .map((m: any) => ({
      partOfSpeech: String(m.partOfSpeech ?? '').toLowerCase(),
      definitions: m.definitions.slice(0, MAX_DEFS_PER_POS).map((d: any) => ({
        text: htmlToText(d.definition ?? ''),
        example: d.examples?.[0] ? htmlToText(d.examples[0]) : null,
        synonyms: [],
        antonyms: [],
      })),
    }));
  const lang = String(english?.[0]?.language ?? '').toLowerCase();
  return { meanings, language: lang && lang !== 'english' ? lang : null };
}

async function fromWiktionary(word: string): Promise<WordEntry> {
  const t0 = Date.now();
  const [defRes, pageHtml] = await Promise.all([
    fetchRes(`${wiktApi}/api/rest_v1/page/definition/${enc(word)}`),
    fetchPageHtml(word).catch(() => ''),
  ]);
  const tFetch = Date.now() - t0;
  if (defRes.status === 404) throw new WordNotFound(null);
  if (!defRes.ok) throw new Error(`wiktionary ${defRes.status}`);

  const { meanings, language } = normalizeWiktionary(await defRes.json(), word);
  if (!meanings.length) throw new WordNotFound(null);

  const extras = await wiktionaryExtras(word, pageHtml);
  console.error(`[wikt] ${word} fetch=${tFetch}ms extras=${Date.now() - t0 - tFetch}ms`);
  return {
    word,
    phonetic: null,
    audioUrl: null,
    origin: extras.origin,
    formOf: detectFormOf(meanings[0].definitions[0]?.text ?? ''),
    related: extras.related,
    meanings,
    sourceUrls: [`${wiktApi}/wiki/${enc(word)}`],
    fetchedAt: new Date().toISOString(),
    language,
  };
}

/* ---------- jisho (japanese) ---------- */

// hiragana/katakana/kanji in the query means the user typed japanese
const CJK_RE = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;

async function fromJisho(word: string): Promise<WordEntry> {
  const res = await fetchJson(`https://jisho.org/api/v1/search/words?keyword=${enc(word)}`);
  const d = res?.data?.[0];
  if (!d?.senses?.length) throw new WordNotFound(null);
  const meanings: Meaning[] = d.senses.slice(0, 8).map((s: any) => ({
    partOfSpeech: String(s.parts_of_speech?.[0] ?? 'word').toLowerCase(),
    definitions: (s.english_definitions ?? []).slice(0, MAX_DEFS_PER_POS)
      .map((text: string) => ({ text, example: null, synonyms: [], antonyms: [] })),
  })).filter((m: Meaning) => m.definitions.length);
  if (!meanings.length) throw new WordNotFound(null);
  const forms = (d.japanese ?? []) as { word?: string; reading?: string }[];
  const head = forms[0];
  return {
    word: head?.word ?? word,
    phonetic: head?.reading && head.reading !== head.word ? head.reading : null,
    audioUrl: null,
    origin: null,
    formOf: null,
    related: [...new Set(forms.flatMap(j => [j.word, j.reading]).filter(Boolean) as string[])]
      .filter(w => w !== head?.word).slice(0, MAX_RELATED),
    meanings,
    sourceUrls: [`https://jisho.org/word/${enc(d.slug ?? word)}`],
    fetchedAt: new Date().toISOString(),
    language: 'japanese',
  };
}

/* ---------- dictionaryapi ---------- */

export function normalizeDictionaryApi(entries: any[], query: string): WordEntry {
  const meanings: Meaning[] = [];
  for (const e of entries) {
    for (const m of e.meanings ?? []) {
      const existing = meanings.find(x => x.partOfSpeech === m.partOfSpeech);
      const bucket = existing ?? meanings[meanings.push({ partOfSpeech: m.partOfSpeech, definitions: [] }) - 1];
      for (const d of m.definitions ?? []) {
        if (bucket.definitions.length >= MAX_DEFS_PER_POS) break;
        if (bucket.definitions.some(x => x.text === d.definition)) continue;
        bucket.definitions.push({
          text: d.definition,
          example: d.example ?? null,
          synonyms: (d.synonyms ?? []).slice(0, MAX_SYNONYMS),
          antonyms: (d.antonyms ?? []).slice(0, MAX_SYNONYMS),
        });
      }
    }
  }

  const phonetic =
    entries.find(e => e.phonetic)?.phonetic ??
    entries.flatMap(e => e.phonetics ?? []).find(p => p.text)?.text ?? null;

  const rawAudio = entries.flatMap(e => e.phonetics ?? []).find(p => p.audio)?.audio ?? null;
  const audioUrl = rawAudio ? (rawAudio.startsWith('//') ? `https:${rawAudio}` : rawAudio) : null;

  const origin = entries.find(e => e.origin)?.origin ?? null;
  const sourceUrls = [...new Set(entries.flatMap(e => e.sourceUrls ?? []))];

  return { word: entries[0]?.word ?? query, phonetic, audioUrl, origin, formOf: null, related: [], meanings, sourceUrls, fetchedAt: new Date().toISOString(), language: null };
}

// ponytail: dictionaryapi.dev goes down for days; after a network failure we skip
// it for 5 min instead of paying an 8s timeout on every lookup. Refresh on success.
let dictApiDownUntil = 0;

// boot probe: learn dictapi's reachability once, with a short timeout, so the
// first real lookup doesn't pay the full timeout on a dead host.
export function probeDictApi() {
  void fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/test`, {
    headers: HEADERS, signal: AbortSignal.timeout(2500),
  }).then(res => {
    if (!res.ok && res.status !== 404) dictApiDownUntil = Date.now() + 5 * 60_000;
    console.error(`[probe] dictionaryapi.dev ${res.ok || res.status === 404 ? 'up' : 'down'}`);
  }).catch(() => {
    dictApiDownUntil = Date.now() + 5 * 60_000;
    console.error('[probe] dictionaryapi.dev unreachable — skipping it for 5min');
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
    dictApiDownUntil = Date.now() + 5 * 60_000;
    throw e;
  }
  if (res.status === 404) throw new WordNotFound(null);
  if (!res.ok) {
    dictApiDownUntil = Date.now() + 5 * 60_000;
    throw new Error(`dictionaryapi ${res.status}`);
  }

  const entry = normalizeDictionaryApi(await res.json(), word);
  const pageHtml = await fetchPageHtml(word).catch(() => '');
  const extras = await wiktionaryExtras(word, pageHtml);
  if (!entry.origin) entry.origin = extras.origin;
  entry.related = extras.related;
  entry.formOf = detectFormOf(entry.meanings[0]?.definitions[0]?.text ?? '');
  return entry;
}

/* ---------- public ---------- */

export interface Suggestion { text: string; lang?: string }

// typed prefixes repeat constantly; a short TTL cache saves the opensearch call
const suggestCache = new Map<string, { at: number; words: Suggestion[] }>();

export async function suggest(q: string): Promise<Suggestion[]> {
  const hit = suggestCache.get(q);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.words;
  let words: Suggestion[];
  if (CJK_RE.test(q)) {
    const res = await fetchJson(`https://jisho.org/api/v1/search/words?keyword=${enc(q)}`);
    words = (res?.data ?? []).slice(0, 8)
      .map((d: any) => ({ text: d.japanese?.[0]?.word ?? d.japanese?.[0]?.reading ?? d.slug, lang: 'japanese' }))
      .filter((s: Suggestion) => s.text);
  } else {
    const res = await fetchJson(
      `${wiktApi}/w/api.php?action=opensearch&search=${enc(q)}&limit=8&namespace=0&format=json`);
    words = (Array.isArray(res?.[1]) ? res[1] : []).map((text: string) => ({ text }));
  }
  if (suggestCache.size > 500) suggestCache.clear();
  suggestCache.set(q, { at: Date.now(), words });
  return words;
}

export async function fetchWord(raw: string, depth = 0): Promise<WordEntry> {
  const word = raw.toLowerCase().trim();
  const t0 = Date.now();

  const cached = getEntry(word);
  if (cached) {
    const entry = JSON.parse(cached.payload) as WordEntry;
    if ('related' in entry) {
      console.error(`[lookup] ${word} ${Date.now() - t0}ms (cache)`);
      return entry;
    }
  }

  const sources: [string, () => Promise<WordEntry>][] = CJK_RE.test(word)
    ? [['jisho', () => fromJisho(word)], ['wiktionary', () => fromWiktionary(word)]]
    : [['dictapi', () => fromDictionaryApi(word)], ['wiktionary', () => fromWiktionary(word)], ['jisho', () => fromJisho(word)]];

  let entry: WordEntry | undefined;
  let source = '';
  let lastErr: unknown;
  for (const [name, fn] of sources) {
    try { entry = await fn(); source = name; break; }
    catch (e) { lastErr = e; }
  }
  if (!entry) {
    if (lastErr instanceof WordNotFound) {
      const s = await suggest(word).catch(() => [] as Suggestion[]);
      throw new WordNotFound(s[0]?.text ?? null);
    }
    throw lastErr;
  }

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

const prefetchQueue = new Set<string>();
let prefetching = false;

async function drainPrefetch() {
  if (prefetching) return;
  prefetching = true;
  while (prefetchQueue.size) {
    const w = prefetchQueue.values().next().value!;
    prefetchQueue.delete(w);
    await fetchWord(w, 1).catch(() => {});
    await sleep(1500);
  }
  prefetching = false;
}
