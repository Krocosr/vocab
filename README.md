# vocab

Self-hosted vocabulary builder — a small dictionary app for people who read.

## Why this was made

I made this because when I read a book I want to search a word's meaning and
save where I found it. Type a word and you get a dictionary card: meaning,
usage, history, and alternative meanings. Save it with a tag — the book's
title, an article, wherever it came from — and the Saved page groups your
words by tag with counts. Review mode shows them back one card at a time.

Related words, synonyms and word roots are clickable links, and every lookup
is cached in a local sqlite file, so wandering from word to word stays fast.
There are no accounts and no API keys; it talks to free dictionary sources
(dictionaryapi.dev and Wiktionary) and keeps one file of your data.

## Preview

| Search | Saved | Review |
|---|---|---|
| ![word card for "vocab"](screenshots/search.png) | ![saved list with tags](screenshots/saved.png) | ![review card](screenshots/review.png) |

## Run

Needs Docker and nothing else:

```sh
docker compose up -d --build
# → http://localhost:8737
```

The compose build context points at this repository, so `--build` always
clones and builds the latest `master` — your local checkout isn't required
(to build local changes instead, temporarily set `build: .`).

Or without Docker (Node ≥ 22.5, for `node:sqlite`):

```sh
npm install
npm run build
npm start          # PORT=8737 node dist/index.js
```

`npm run dev` runs via tsx without a build step; `npm run selfcheck` runs the
assert checks (`--live` to exercise the real APIs).

## CLI

The same thing from your terminal — it reads and writes the same
`data/vocab.db` as the server, so words you save here show up in the web app:

```sh
npm link          # once — puts `vocab` on your PATH

vocab banality            # look up a word
vocab save banality -t "king in yellow"
vocab list                # saved words (vocab list king in yellow to filter)
vocab tags                # tag counts
vocab rm banality
vocab review              # interactive reveal-card pass
```

## Notes

- Your data is `data/vocab.db` — one table that doubles as lookup cache and
  saved list. A `*.bak` snapshot is written on every server start; back that
  folder up and you keep everything.
- Needs internet at runtime (the free dictionary APIs); no word database is
  bundled.
- "Purpose" is assembled from part of speech, examples and synonyms — free
  dictionaries have no literal "purpose" field.

## License

MIT — see [LICENSE](LICENSE).
