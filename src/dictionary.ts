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
const TIMEOUT = 8000;
const MAX_DEFS_PER_POS = 6;
const MAX_SYNONYMS = 8;
const MAX_ETYMOLOGY = 1500;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
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

  return { word: entries[0]?.word ?? query, phonetic, audioUrl, origin, meanings, sourceUrls, fetchedAt: new Date().toISOString() };
}

async function fetchEtymology(word: string): Promise<string | null> {
  const page = encodeURIComponent(word);
  const sectionsRes = await fetchJson(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${page}&prop=sections&format=json&formatversion=2`);
  const sections: { index: string; line: string }[] = sectionsRes?.parse?.sections ?? [];
  const etym = sections.find(s => /^Etymology/.test(s.line));
  if (!etym) return null;

  const textRes = await fetchJson(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${page}&prop=text&section=${etym.index}&format=json&formatversion=2`);
  const html: string = textRes?.parse?.text ?? '';
  // ponytail: prose lives in <p>; etymology trees/navboxes are div+ul — skipping
  // non-<p> content drops them without a DOM parser. Upgrade to cheerio if needed.
  const text = (html.match(/<p\b[\s\S]*?<\/p>/gi) ?? [])
    .map(p => htmlToText(p))
    .filter(Boolean)
    .join(' ');
  return text ? text.slice(0, MAX_ETYMOLOGY) : null;
}

async function fromDictionaryApi(word: string): Promise<WordEntry> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT),
  });
  if (res.status === 404) throw new WordNotFound(null);
  if (!res.ok) throw new Error(`dictionaryapi ${res.status}`);

  const entry = normalizeDictionaryApi(await res.json(), word);
  if (!entry.origin) entry.origin = await fetchEtymology(word).catch(() => null);
  return entry;
}

async function fromWiktionary(word: string): Promise<WordEntry> {
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
    { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
  if (res.status === 404) throw new WordNotFound(null);
  if (!res.ok) throw new Error(`wiktionary ${res.status}`);

  const data = await res.json();
  const english = data.en ?? data.eng ?? Object.values(data)[0] as any[];
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
  if (!meanings.length) throw new WordNotFound(null);

  return {
    word,
    phonetic: null,
    audioUrl: null,
    origin: await fetchEtymology(word).catch(() => null),
    meanings,
    sourceUrls: [`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`],
    fetchedAt: new Date().toISOString(),
  };
}

export async function suggest(q: string): Promise<string[]> {
  const res = await fetchJson(
    `https://en.wiktionary.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json`);
  return Array.isArray(res?.[1]) ? res[1] : [];
}

export async function fetchWord(raw: string): Promise<WordEntry> {
  const word = raw.toLowerCase().trim();

  const cached = getEntry(word);
  if (cached) return JSON.parse(cached.payload) as WordEntry;

  let entry: WordEntry;
  try {
    entry = await fromDictionaryApi(word);
  } catch (primaryErr) {
    try {
      entry = await fromWiktionary(word);
    } catch (fallbackErr) {
      if (fallbackErr instanceof WordNotFound) {
        const suggestions = await suggest(word).catch(() => [] as string[]);
        throw new WordNotFound(suggestions[0] ?? null);
      }
      throw primaryErr instanceof WordNotFound ? fallbackErr : primaryErr;
    }
  }

  putEntry(word, JSON.stringify(entry));
  return entry;
}
