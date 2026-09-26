# vocab

*A commonplace book for words.*

---

## Why this was made

The reader who keeps a dictionary beside their chair knows the pleasure of a
word newly met. Yet the pleasure is fleeting: the word is looked up, admired,
and by the next chapter quite forgotten. This little service was built to
arrest that forgetting.

Whilst reading — a novel, an essay, some yellowed tale found late at night —
one may search a word and receive, in the manner of a good dictionary card, its
**meaning**, its **purpose** (how it is used, and with what company), its
**history** (whence it came), and its **other meanings** besides. And having
found the word, one may lay it aside with a small note of *where* it was found
— *King in Yellow*, say — so that the list of saved words becomes, in time, a
map of one's own reading.

It is light, plain, and meant to be self-hosted: a private commonplace book,
kept in a single file, asking nothing of accounts, keys, or subscriptions —
only a connection to the free dictionaries of the wider world.

## Preview

*(reserved for screenshots)*

```
┌──────────────────────────────────────────┐
│  serendipity                        [Save] │
│                                          │
│  Meaning                                 │
│  The phenomenon of making an unplanned,  │
│  fortunate discovery …                   │
│                                          │
│  History                                 │
│  From Serendip … Coined by Horace        │
│  Walpole in 1754 …                       │
└──────────────────────────────────────────┘
```

## Features

- **Search** — autocomplete as you type; "did you mean" on misses
- **Word card** — Meaning · Purpose · History · Alternative meanings ·
  Related words, all linked: click any related word to walk the dictionary
- **Save with a tag** — record where you found the word; tags suggest
  themselves as you reuse them, with per-tag counts and filtering
- **Review** — a simple reveal-card pass over your saved words,
  stalest first
- **Predictive cache** — every lookup is cached in SQLite, and its related
  words are quietly fetched in the background so following a link is instant
- **No keys, no auth** — data comes from dictionaryapi.dev and Wiktionary,
  both free; the whole dictionary is one container and one file

## Run

```sh
docker compose up -d --build
# → http://localhost:8737
```

The compose build context points at this repository, so `--build` always
clones and builds the latest `master` from GitHub — your local checkout is
not required (to build local changes instead, temporarily set `build: .`).

Or without Docker (Node ≥ 22.5, for `node:sqlite`):

```sh
npm install
npm run build
npm start          # PORT=8737 node dist/index.js
```

`npm run dev` runs via tsx without a build step; `npm run selfcheck` runs the
assert checks (`--live` to exercise the real APIs).

## Notes

- The database is `data/vocab.db` — one table serving as both lookup cache
  and saved list. Back it up and you keep everything.
- The service needs internet at runtime (free dictionary APIs); no word
  database is bundled.
- "Purpose" is assembled from part of speech, examples, and synonyms — free
  dictionaries have no literal "purpose" field.

## License

MIT — see [LICENSE](LICENSE).
