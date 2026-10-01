/**
 * Storage abstraction for vocab app.
 * Exports a single `store` object with async methods:
 *   getWord(word), saveWord(word, tag), unsaveWord(word),
 *   listSaved(), listTags(), reviewQueue(), recordReview(word, known), suggest(q),
 *   listReviewHistory(word), smartReviewQueue()
 *
 * Chooses `web` implementation (fetch to /api/*) when running in browser,
 * or `local` implementation (Capacitor SQLite/Preferences) when running
 * under Capacitor native (window.Capacitor?.isNativePlatform?.() === true).
 */

// ──────────────────────────────────────────────────────────────────────────
// Web implementation — uses the existing Express /api/* endpoints
// ──────────────────────────────────────────────────────────────────────────
const webStore = {
  async getWord(word) {
    const res = await fetch(`/api/word/${encodeURIComponent(word)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`getWord failed: ${res.status}`);
    }
    return res.json();
  },

  async saveWord(word, tag) {
    const res = await fetch(`/api/words/${encodeURIComponent(word)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag })
    });
    if (!res.ok) throw new Error(`saveWord failed: ${res.status}`);
    return res.json();
  },

  async unsaveWord(word) {
    const res = await fetch(`/api/words/${encodeURIComponent(word)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`unsaveWord failed: ${res.status}`);
    return res.json();
  },

  async listSaved() {
    const res = await fetch('/api/words');
    if (!res.ok) throw new Error(`listSaved failed: ${res.status}`);
    return res.json();
  },

  async listTags() {
    const res = await fetch('/api/tags');
    if (!res.ok) throw new Error(`listTags failed: ${res.status}`);
    return res.json();
  },

  async reviewQueue() {
    const res = await fetch('/api/review');
    if (!res.ok) throw new Error(`reviewQueue failed: ${res.status}`);
    return res.json();
  },

  async recordReview(word, known) {
    const res = await fetch(`/api/words/${encodeURIComponent(word)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ known })
    });
    if (!res.ok) throw new Error(`recordReview failed: ${res.status}`);
    return res.json();
  },

  async suggest(q, opts = {}) {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: opts.signal });
    if (!res.ok) throw new Error(`suggest failed: ${res.status}`);
    return res.json();
  },

  async listReviewHistory(word) {
    const res = await fetch(`/api/words/${encodeURIComponent(word)}/reviews`);
    if (!res.ok) throw new Error(`listReviewHistory failed: ${res.status}`);
    return res.json();
  },

  async smartReviewQueue() {
    const res = await fetch('/api/review/smart');
    if (!res.ok) throw new Error(`smartReviewQueue failed: ${res.status}`);
    return res.json();
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Local implementation — uses Capacitor SQLite for words/tags/reviews
// and fetches dictionary data directly from dictionaryapi.dev
// ──────────────────────────────────────────────────────────────────────────
const localStore = {
  _dbReady: false,
  _db: null,
  _dictCache: new Map(), // in-memory hot path; SQLite is the durable copy

  async _initDb() {
    if (this._dbReady) return this._db;
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    const db = await CapacitorSQLite.createConnection({
      database: 'vocab',
      version: 1,
      encrypted: false,
      mode: 'no-encryption',
      readonly: false
    });
    await db.open();
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS entries (
        word       TEXT PRIMARY KEY,
        payload    TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS words (
        word TEXT PRIMARY KEY,
        tag TEXT,
        saved_at INTEGER NOT NULL,
        review_count INTEGER DEFAULT 0,
        known_count INTEGER DEFAULT 0,
        last_reviewed INTEGER
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        known INTEGER NOT NULL,
        reviewed_at INTEGER NOT NULL,
        FOREIGN KEY(word) REFERENCES words(word) ON DELETE CASCADE
      );
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_words_tag ON words(tag);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_word ON reviews(word);`);
    this._db = db;
    this._dbReady = true;
    return db;
  },

  async _fetchDictionaryData(word) {
    // Persistent cache first: a lookup must work offline, and the app must not
    // re-hit upstream for a word the user has already read.
    const db = await this._initDb();
    const row = (await db.query('SELECT payload FROM entries WHERE word = ?', [word])).values?.[0];
    if (row?.payload) {
      try {
        const entry = JSON.parse(row.payload);
        this._dictCache.set(word, entry);
        return entry;
      } catch { /* corrupt row — fall through to network */ }
    }

    const entry = await this._fetchFromUpstream(word);
    if (entry) await this._persistEntry(db, word, entry);
    return entry;
  },

  async _persistEntry(db, word, entry) {
    this._dictCache.set(word, entry);
    if (this._dictCache.size > 200) {
      const oldest = this._dictCache.keys().next().value;
      this._dictCache.delete(oldest);
    }
    await db.run('INSERT INTO entries (word, payload, fetched_at) VALUES (?, ?, ?)', [
      word, JSON.stringify(entry), Date.now(),
    ]).catch(() => {}); // duplicates just mean it was cached concurrently
  },

  // dictionaryapi.dev is a fast path that goes down for days; Wiktionary is the
  // source of truth. Try both, exactly as the server does.
  async _fetchFromUpstream(word) {
    const direct = await this._fromDictionaryApi(word);
    if (direct) return direct;
    return this._fromWiktionary(word);
  },

  async _fromDictionaryApi(word) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return this._normalizeDictionaryApi((await res.json())[0], word);
    } catch {
      return null; // down or timed out — fall through to Wiktionary
    }
  },

  async _fromWiktionary(word) {
    try {
      const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const english = data[word] ?? Object.values(data)[0] ?? [];
      const meanings = [];
      for (const m of english) {
        const defs = (m.definitions ?? []).slice(0, 6).map(d => ({
          text: String(d.definition ?? '').replace(/<[^>]+>/g, ''),
          example: d.examples?.[0] ? String(d.examples[0]).replace(/<[^>]+>/g, '') : null,
          synonyms: [],
          antonyms: [],
        })).filter(d => d.text);
        if (defs.length) meanings.push({ partOfSpeech: String(m.partOfSpeech ?? '').toLowerCase(), definitions: defs });
      }
      if (!meanings.length) return null;
      return {
        word,
        phonetic: null,
        audioUrl: null,
        meanings,
        origin: null,
        formOf: null,
        related: [],
        sourceUrls: [`https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`],
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  _normalizeDictionaryApi(raw, query) {
    // Simplified normalization matching the server's normalizeDictionaryApi
    const entry = {
      word: query,
      phonetic: null,
      meanings: [],
      origin: null,
      related: [],
      sourceUrls: [`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`]
    };

    if (!raw) return entry;

    if (raw.phonetics?.length) {
      const withText = raw.phonetics.find(p => p.text);
      if (withText) entry.phonetic = withText.text;
    }

    if (raw.meanings) {
      for (const m of raw.meanings) {
        const pos = m.partOfSpeech;
        const defs = [];
        for (const d of (m.definitions || []).slice(0, 6)) {
          defs.push({
            text: d.definition,
            example: d.example || null,
            synonyms: d.synonyms || [],
            antonyms: d.antonyms || []
          });
        }
        if (defs.length) {
          entry.meanings.push({ partOfSpeech: pos, definitions: defs });
        }
      }
    }

    // No origin/etymology from dictionaryapi.dev - would need Wiktionary
    return entry;
  },

  async getWord(word) {
    const db = await this._initDb();
    // Get local saved data
    const savedRows = await db.query('SELECT * FROM words WHERE word = ?', [word]);
    const saved = savedRows.values?.[0] || null;

    // Fetch dictionary data
    const dictData = await this._fetchDictionaryData(word);
    if (!dictData) return null;

    // Merge saved data into dictionary entry
    if (saved) {
      dictData.saved = true;
      dictData.saved_tag = saved.tag;
      dictData.saved_at = new Date(saved.saved_at).toISOString();
      dictData.review_count = saved.review_count;
      dictData.known_count = saved.known_count;
      dictData.last_reviewed = saved.last_reviewed ? new Date(saved.last_reviewed).toISOString() : null;
    } else {
      dictData.saved = false;
    }
    return dictData;
  },

  async saveWord(word, tag) {
    const db = await this._initDb();
    const now = Date.now();
    await db.run(
      `INSERT INTO words (word, tag, saved_at, review_count, known_count)
       VALUES (?, ?, ?, 0, 0)
       ON CONFLICT(word) DO UPDATE SET tag = excluded.tag`,
      [word, tag || null, now]
    );
    return { word, tag, saved_at: new Date(now).toISOString() };
  },

  async unsaveWord(word) {
    const db = await this._initDb();
    await db.run('DELETE FROM words WHERE word = ?', [word]);
    await db.run('DELETE FROM reviews WHERE word = ?', [word]);
    return { word };
  },

  async listSaved() {
    const db = await this._initDb();
    const rows = await db.query('SELECT * FROM words ORDER BY saved_at DESC');
    return (rows.values || []).map(r => ({
      word: r.word,
      saved_tag: r.tag,
      saved_at: new Date(r.saved_at).toISOString(),
      review_count: r.review_count,
      known_count: r.known_count
    }));
  },

  async listTags() {
    const db = await this._initDb();
    const rows = await db.query(`
      SELECT tag, COUNT(*) as count FROM words
      WHERE tag IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
    `);
    return (rows.values || []).map(r => ({ tag: r.tag, count: r.count }));
  },

  async reviewQueue() {
    const db = await this._initDb();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    // Get words due for review (not reviewed in 24h or never reviewed)
    const rows = await db.query(`
      SELECT * FROM words
      WHERE last_reviewed IS NULL OR (? - last_reviewed) > ?
      ORDER BY last_reviewed ASC NULLS FIRST, saved_at ASC
      LIMIT 50
    `, [now, day]);

    const results = [];
    for (const r of (rows.values || [])) {
      // Fetch dictionary data for each word in the queue
      const dictData = await this._fetchDictionaryData(r.word);
      if (dictData) {
        results.push({
          ...dictData,
          word: r.word,
          tag: r.tag,
          saved_at: new Date(r.saved_at).toISOString(),
          review_count: r.review_count,
          known_count: r.known_count,
          last_reviewed: r.last_reviewed ? new Date(r.last_reviewed).toISOString() : null
        });
      }
    }
    return results;
  },

  async recordReview(word, known) {
    const db = await this._initDb();
    const now = Date.now();
    await db.run(
      'INSERT INTO reviews (word, known, reviewed_at) VALUES (?, ?, ?)',
      [word, known ? 1 : 0, now]
    );
    await db.run(
      `UPDATE words SET
         review_count = review_count + 1,
         known_count = known_count + ?,
         last_reviewed = ?
       WHERE word = ?`,
      [known ? 1 : 0, now, word]
    );
    return { word, known, reviewed_at: new Date(now).toISOString() };
  },

  async suggest(q, opts = {}) {
    // For suggestions, we can only suggest from locally saved words
    // since we don't have a local dictionary suggestions API
    const db = await this._initDb();
    const rows = await db.query(
      'SELECT word FROM words WHERE word LIKE ? LIMIT 10',
      [`${q}%`]
    );
    return (rows.values || []).map(r => r.word);
  },

  async listReviewHistory(word) {
    const db = await this._initDb();
    const rows = await db.query(
      'SELECT known, reviewed_at FROM reviews WHERE word = ? ORDER BY reviewed_at DESC',
      [word]
    );
    return (rows.values || []).map(r => ({
      known: Boolean(r.known),
      reviewed_at: new Date(r.reviewed_at).toISOString()
    }));
  },

  async smartReviewQueue() {
    const db = await this._initDb();
    // Words actually missed first. A never-reviewed word is unmeasured, not
    // "0% known" — treating it as zero would let it swamp every real miss.
    // Mirrors smartReviewQueue() in src/db.ts.
    const rows = await db.query(`
      SELECT *
      FROM words
      ORDER BY CASE WHEN review_count = 0 THEN 1 ELSE 0 END ASC,
               CAST(known_count AS REAL) / review_count ASC,
               last_reviewed IS NULL DESC, last_reviewed ASC
      LIMIT 50
    `);

    const results = [];
    for (const r of (rows.values || [])) {
      const dictData = await this._fetchDictionaryData(r.word);
      if (dictData) {
        results.push({
          ...dictData,
          word: r.word,
          tag: r.tag,
          saved_at: new Date(r.saved_at).toISOString(),
          review_count: r.review_count,
          known_count: r.known_count,
          last_reviewed: r.last_reviewed ? new Date(r.last_reviewed).toISOString() : null
        });
      }
    }
    return results;
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Platform detection and store export
// ──────────────────────────────────────────────────────────────────────────
const isNative = !!(window.Capacitor?.isNativePlatform?.());

export const store = isNative ? localStore : webStore;

// Re-export for testing/debugging
export { webStore, localStore, isNative };