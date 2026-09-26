# Vocab — Agent Guidance

Self-hosted vocabulary builder. Google-style word card (meaning, purpose/usage,
history/etymology, alternative meanings) + saved list + reveal-style review.

## Commands

- `npm run build` — compile `src/*.ts` to `dist/` (required after every `.ts` edit)
- `npm start` — run compiled `dist/index.js` (serves public/ + /api/*)
- `npm run dev` — run via `ts-node-esm` (no build step)
- `npm run selfcheck` — assert-based checks; `--live` flag also hits real APIs
- `docker compose up -d --build` — self-host at http://127.0.0.1:8737

## Architecture

- **ESM** (`"type": "module"`) — imports use `.js` extensions for `.ts` source
- **Express** server (`src/index.ts`) — JSON API + `express.static(public/)`
- **SQLite** via `better-sqlite3` — `data/vocab.db`, one table `entries` doubles
  as lookup cache (`saved_at NULL`) and saved list (`saved_at NOT NULL`)
- **Frontend**: vanilla `public/{index.html,app.js,style.css}` — no deps, hash
  routing (`#/` `#/saved` `#/review`), renders with `textContent` only

## Word data pipeline (`src/dictionary.ts`)

1. SQLite cache hit → return
2. `api.dictionaryapi.dev/api/v2/entries/en/<word>` → normalize (merge entries,
   dedupe defs, cap 6 defs/POS + 8 synonyms)
3. `origin` absent → Wiktionary `action=parse` sections → `Etymology*` section →
   `prop=text` HTML → regex strip (cap 1500 chars)
4. 404 → Wiktionary `action=opensearch` once → `suggestion` in error body
5. `suggest()` = opensearch proxy for the search `<datalist>`

All upstream fetches: built-in `fetch`, 8s `AbortSignal.timeout`, descriptive
`User-Agent` (Wikimedia requires one). Runtime needs internet — no offline DB.

## Gotchas

- Better-sqlite3 is a **runtime** dep with native prebuilds — Dockerfile must
  run plain `npm ci` (NOT `--ignore-scripts`) so prebuilds download
- "Purpose" section is rendered from part-of-speech + examples + synonyms;
  free dictionaries have no literal "purpose" field
- No auth — bind mount is `127.0.0.1` only by default; opening to LAN means
  anyone on the network can use it (intended for self-host)
- Review ordering: `last_reviewed_at` NULLs first, then stalest; POST
  `/api/words/:w/review {known}` bumps review/known counts
