import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'node:url';
import { getEntry, listSaved, listTags, recordReview, reviewQueue, setSaved } from './db.js';
import { fetchWord, probeDictApi, suggest, WordNotFound } from './dictionary.js';

const app = express();
app.use(compression());
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url)), { maxAge: 0 }));

const WORD_RE = /^[\p{L}\p{M}\p{N}' -]{1,64}$/u;

function validWord(w: string): boolean {
  return WORD_RE.test(w) && w.trim().length > 0;
}

app.get('/api/word/:word', async (req, res) => {
  const word = req.params.word.toLowerCase().trim();
  if (!validWord(word)) return res.status(400).json({ error: 'invalid word' });
  try {
    const entry = await fetchWord(word);
    const row = getEntry(word);
    res.json({ ...entry, saved: !!row?.saved_at, savedTag: row?.saved_tag ?? null });
  } catch (e) {
    if (e instanceof WordNotFound) return res.status(404).json({ error: 'not found', suggestion: e.suggestion });
    throw e;
  }
});

app.get('/api/suggest', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q || q.length > 64) return res.json([]);
  try {
    res.json(await suggest(q));
  } catch {
    res.json([]);
  }
});

app.get('/api/words', (_req, res) => {
  res.json(listSaved());
});

app.put('/api/words/:word', async (req, res) => {
  const word = req.params.word.toLowerCase().trim();
  if (!validWord(word)) return res.status(400).json({ error: 'invalid word' });
  try {
    if (!getEntry(word)) await fetchWord(word); // validate it's a real word + warm cache
    const tag = typeof req.body?.tag === 'string' ? req.body.tag.trim().slice(0, 60) || null : null;
    setSaved(word, true, tag);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof WordNotFound) return res.status(404).json({ error: 'not found', suggestion: e.suggestion });
    throw e;
  }
});

app.get('/api/tags', (_req, res) => {
  res.json(listTags());
});

app.delete('/api/words/:word', (req, res) => {
  setSaved(req.params.word.toLowerCase().trim(), false);
  res.json({ ok: true });
});

app.get('/api/review', (_req, res) => {
  res.json(reviewQueue().map(r => ({ ...JSON.parse(r.payload), word: r.word })));
});

app.post('/api/words/:word/review', (req, res) => {
  const word = req.params.word.toLowerCase().trim();
  const known = req.body?.known !== false;
  const result = recordReview(word, known);
  if (!result.changes) return res.status(404).json({ error: 'not saved' });
  res.json({ ok: true });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(502).json({ error: 'upstream failure' });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, '0.0.0.0', () => console.log(`vocab on :${port}`));
probeDictApi();
