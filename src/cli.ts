#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

// dev checkout (npm link) shares the repo's db; global installs get ~/.vocab
const localDb = fileURLToPath(new URL('../data/vocab.db', import.meta.url));
process.env.VOCAB_DB ??= existsSync(localDb) ? localDb : join(homedir(), '.vocab', 'vocab.db');
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const { fetchWord, WordNotFound } = await import('./dictionary.js');
const { getEntry, listSaved, listTags, setSaved, recordReview, reviewQueue } = await import('./db.js');

type Entry = Awaited<ReturnType<typeof fetchWord>>;

const B = '\x1b[1m', D = '\x1b[2m', N = '\x1b[0m';
const head = (s: string) => console.log(`\n${D}${s.toUpperCase()}${N}`);
const body = (s: string | null | undefined) => { if (s) console.log(s); };

const HELP = `vocab — dictionary + saved words

  vocab <word>          look up a word
  vocab s <word>        look up a word named like a command (list, save…)
                        (vocab search / vocab -- work too)
  vocab save <word> [-t tag]  save it (tag = where you found it)
  vocab rm <word>       remove from saved
  vocab list [tag]      show saved words
  vocab tags            tag counts
  vocab review          reveal-card pass over saved words
  vocab version         print version
`;

function printEntry(e: Entry, saved: { at: string | null; tag: string | null }) {
  console.log(`\n${B}${e.word}${N}${e.phonetic ? '  ' + D + e.phonetic + N : ''}${saved.at ? D + `  (saved ${saved.tag ? '· ' + saved.tag : ''})` + N : ''}`);
  const first = e.meanings[0]?.definitions[0];
  head('meaning'); body(first?.text); if (first?.example) console.log(`${D}e.g. ${first.example}${N}`);
  head('purpose');
  console.log([...new Set(e.meanings.map(m => m.partOfSpeech).filter(Boolean))].join(' · ') || '(unknown)');
  const syn = e.meanings.flatMap(m => m.definitions.flatMap(d => d.synonyms));
  const ant = e.meanings.flatMap(m => m.definitions.flatMap(d => d.antonyms));
  if (syn.length) console.log(`syn: ${[...new Set(syn)].slice(0, 8).join(', ')}`);
  if (ant.length) console.log(`ant: ${[...new Set(ant)].slice(0, 8).join(', ')}`);
  head('history'); body(e.origin ?? '(none found)');
  if (e.meanings.length > 1) {
    head('alternative meanings');
    for (const m of e.meanings.slice(1)) {
      console.log(`${B}${m.partOfSpeech}${N}`);
      for (const d of m.definitions.slice(0, 3)) console.log(`  ${d.text}`);
    }
  }
  if (e.related.length) { head('related'); console.log(e.related.join(', ')); }
  console.log();
}

async function lookup(word: string) {
  try {
    const entry = await fetchWord(word);
    const row = getEntry(word);
    printEntry(entry, { at: row?.saved_at ?? null, tag: row?.saved_tag ?? null });
  } catch (e) {
    if (e instanceof WordNotFound)
      console.error(`no entry found for "${word}"${e.suggestion ? ` — did you mean "${e.suggestion}"?` : ''}`);
    else console.error('couldn\'t reach the dictionary — try again in a moment');
    process.exitCode = 1;
  }
}

const rlBox: { it?: ReturnType<typeof createInterface> } = {};
const ask = (q: string) => {
  if (!rlBox.it) {
    rlBox.it = createInterface({ input: process.stdin, output: process.stdout });
    rlBox.it.on('close', () => process.exit(0));
  }
  return new Promise<string>(r => rlBox.it!.question(q, r));
};

const [cmd, ...rest] = process.argv.slice(2);
const argText = rest.join(' ').toLowerCase().trim();

switch (cmd?.toLowerCase()) {
  case undefined:
  case 'help':
  case '--help':
    process.stdout.write(HELP);
    break;

  case 'save': {
    if (!argText) { console.error('usage: vocab save <word> [-t tag]'); process.exitCode = 1; break; }
    const m = argText.match(/^(.*?)\s+(?:-t|--tag)\s+(.+)$/);
    const w = (m ? m[1] : argText).trim(), tag = m?.[2].trim() || null;
    try {
      if (!getEntry(w)) await fetchWord(w);
      setSaved(w, true, tag);
      console.log(`saved ${B}${w}${N}${tag ? ` · ${tag}` : ''}`);
    } catch { console.error(`can't save "${w}" — no entry found`); process.exitCode = 1; }
    break;
  }

  case 'rm':
  case 'remove':
  case 'unsave': {
    if (!argText) { console.error('usage: vocab rm <word>'); process.exitCode = 1; break; }
    setSaved(argText, false);
    console.log(`removed ${B}${argText}${N}`);
    break;
  }

  case 'list': {
    const rows = listSaved().filter(r => !argText || r.saved_tag === argText);
    if (!rows.length) { console.log('nothing saved yet'); break; }
    for (const r of rows)
      console.log(`${B}${r.word}${N}${D}  saved ${r.saved_at.slice(0, 10)}${r.saved_tag ? ` · ${r.saved_tag}` : ''} · reviewed ${r.review_count}x${N}`);
    console.log(`${D}${rows.length} word(s)${N}`);
    break;
  }

  case 'tags': {
    const tags = listTags();
    if (!tags.length) { console.log('no tags yet'); break; }
    for (const t of tags) console.log(`${t.tag} ${D}(${t.count})${N}`);
    break;
  }

  case 's':
  case 'search':
  case 'lookup':
  case '--':
    await lookup(argText);
    break;

  case 'version':
  case '--version':
  case '-v':
    console.log(VERSION);
    break;

  case 'review': {
    const queue = reviewQueue();
    if (!queue.length) { console.log('nothing to review — save some words first'); break; }
    for (let i = 0; i < queue.length; i++) {
      const row = queue[i];
      const entry = JSON.parse(row.payload) as Entry;
      console.log(`\n${B}${row.word}${N}  ${D}${i + 1}/${queue.length}${N}`);
      const a = (await ask(`${D}enter=reveal q=quit ${N}`)).trim().toLowerCase();
      if (a === 'q') break;
      const first = entry.meanings?.[0]?.definitions?.[0];
      if (first) console.log(first.text);
      if (entry.origin) console.log(`${D}${entry.origin}${N}`);
      const k = (await ask(`${D}knew it? y/n/q ${N}`)).trim().toLowerCase();
      if (k === 'q') break;
      recordReview(row.word, k !== 'n');
    }
    break;
  }

  default:
    await lookup([cmd, ...rest].join(' '));
}

rlBox.it?.close();
