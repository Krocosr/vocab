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
- **SQLite** via built-in `node:sqlite` (DatabaseSync) — `data/vocab.db`, one table
  `entries` doubles as lookup cache (`saved_at NULL`) and saved list
  (`saved_at NOT NULL`, optional `saved_tag`)
- **Frontend**: vanilla `public/{index.html,app.js,style.css}` — no deps, hash
  routing (`#/` `#/saved` `#/review`), renders with `textContent` only

## Word data pipeline (`src/dictionary.ts`)

1. SQLite cache hit → return (payloads without `related` refetch once — stale shape)
2. `api.dictionaryapi.dev` → normalize; on network error/5xx sets `dictApiDownUntil`
   (5 min skip — the API goes down for days; saves 8s timeout per lookup)
3. Fallback: Wiktionary `rest_v1/page/definition/<w>` (parallel with `prop=sections`)
4. Extras: `Etymology*` + `Derived|Related terms|See also` sections → `prop=text`
   HTML → `<p>`-only prose (origin) / `/wiki/x` links (related). Caps: 1500 chars,
   12 related, 3 related-sections
5. `formOf` = regex on first definition text ("plural of rouse" → `{kind, word}`)
6. Prefetch: depth-1 only, serial queue, 1.5s pace (Wiktionary 429s otherwise);
   429 → one retry after 2s
7. 404 → Wiktionary `action=opensearch` once → `suggestion` in error body

All upstream fetches: built-in `fetch`, 8s `AbortSignal.timeout`, descriptive
`User-Agent` (Wikimedia requires one). Runtime needs internet — no offline DB.

## Gotchas

- `node:sqlite` needs Node ≥22.5 — image is `node:24-slim`; dev on Node 24
- express is the only runtime dep; dev flow is `tsx` (ts-node can't run TS 6)
- "Purpose" section is rendered from part-of-speech + examples + synonyms;
  free dictionaries have no literal "purpose" field
- No auth — bind mount is `127.0.0.1` only by default; opening to LAN means
  anyone on the network can use it (intended for self-host)
- Review ordering: `last_reviewed_at` NULLs first, then stalest; POST
  `/api/words/:w/review {known}` bumps review/known counts
