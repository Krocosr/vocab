import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.VOCAB_DB ?? 'data/vocab.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS entries (
  word             TEXT PRIMARY KEY,
  payload          TEXT NOT NULL,
  fetched_at       TEXT NOT NULL,
  saved_at         TEXT,
  review_count     INTEGER NOT NULL DEFAULT 0,
  known_count      INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT
)`);

try { db.exec('ALTER TABLE entries ADD COLUMN saved_tag TEXT'); } catch {}

export interface EntryRow {
  word: string;
  payload: string;
  fetched_at: string;
  saved_at: string | null;
  saved_tag: string | null;
  review_count: number;
  known_count: number;
  last_reviewed_at: string | null;
}

export interface SavedRow {
  word: string;
  saved_at: string;
  saved_tag: string | null;
  review_count: number;
  known_count: number;
  last_reviewed_at: string | null;
}

const now = () => new Date().toISOString();

export const getEntry = (word: string) =>
  db.prepare('SELECT * FROM entries WHERE word = ?').get(word) as EntryRow | undefined;

export const putEntry = (word: string, payload: string) =>
  db.prepare(`INSERT INTO entries (word, payload, fetched_at) VALUES (?, ?, ?)
              ON CONFLICT(word) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`)
    .run(word, payload, now());

export const listSaved = () =>
  db.prepare(`SELECT word, saved_at, saved_tag, review_count, known_count, last_reviewed_at
              FROM entries WHERE saved_at IS NOT NULL ORDER BY saved_at DESC`)
    .all() as unknown as SavedRow[];

export const setSaved = (word: string, saved: boolean, tag: string | null = null) =>
  db.prepare('UPDATE entries SET saved_at = ?, saved_tag = ? WHERE word = ?')
    .run(saved ? now() : null, saved ? tag : null, word);

export const listTags = () =>
  db.prepare(`SELECT saved_tag AS tag, COUNT(*) AS count FROM entries
              WHERE saved_at IS NOT NULL AND saved_tag IS NOT NULL AND saved_tag != ''
              GROUP BY saved_tag ORDER BY count DESC, tag ASC`)
    .all() as unknown as { tag: string; count: number }[];

export const recordReview = (word: string, known: boolean) =>
  db.prepare(`UPDATE entries SET review_count = review_count + 1,
              known_count = known_count + ?, last_reviewed_at = ?
              WHERE word = ? AND saved_at IS NOT NULL`)
    .run(known ? 1 : 0, now(), word);

export const reviewQueue = () =>
  db.prepare(`SELECT word, payload FROM entries WHERE saved_at IS NOT NULL
              ORDER BY last_reviewed_at IS NULL DESC, last_reviewed_at ASC`)
    .all() as unknown as Pick<EntryRow, 'word' | 'payload'>[];
