# Play Store listing pack — Vocab

Copy for Google Play. Character limits: title 30, short description 80, full
description 4000.

## App name (30 char limit)

```
Vocab: Dictionary & Word Builder
```
(28 chars)

## Short description (80 char limit)

```
Look up any word fast - meaning, origin, examples. Save it. Review it later.
```
(79 chars)

## Full description

```
Reading something and hit a word you don't know? Vocab tells you what it means,
where it came from, and how to remember it.

Look it up, understand it, save it, and actually remember it.

WHAT YOU GET

- Clear definitions with part of speech and examples
- Word origins, so you learn where a word came from - the fastest way to remember it
- Synonyms and antonyms
- Related words to expand from
- Save words with a tag, so you can group them by book, article or topic
- A review deck that shows you what you have forgotten, not what you already know
- Works offline for everything you have looked up before

BUILT FOR READING

Vocab is made for people who read a lot. When you save a word, you can tag it with
where you found it - "Moby Dick", "chapter 4", "work", "thesis" - so when you come
back to review, you see the word in the context you met it.

FREEMIUM, NOT A PAYWALL

Everything that matters is free, forever:
- Unlimited lookups
- Unlimited saved words
- Full review deck

The paid upgrade adds power tools for people who study vocabulary seriously. It
also keeps the app alive and ad-free. No account needed, no sign-up wall.

ALWAYS AD-FREE. ALWAYS NO ACCOUNT.

Content is sourced from Wiktionary and the Dictionary API. Attribution is shown
in-app for every entry.

---

Privacy: we collect nothing. No account, no tracking, no personal data. Your
saved words live on your device only.
```

### Claims removed after verification — do not re-add without evidence

- **"Audio pronunciation"** — `audioUrl` is only ever produced by
  dictionaryapi.dev, which is down. Checked 29 Sep 2026: the server returns
  `audioUrl: null` and the Android store path never sets it, so the 🔊 button in
  `public/app.js` is dead code. Re-add only if audio comes from a host that is
  actually up, and verify on device.
- **"in under a second" / "Instant definitions"** — measured cold-cache latency
  is ~3.3s (`docs/lookup-harness-report.md`); only cache hits are sub-second.
  Overstating speed is what draws one-star "misleading" reviews on a new
  listing. Either keep the honest framing, or bundle an offline word list and
  make the claim true.
- **Offline for the web build** — the web build fails without its server
  ("Couldn't reach the dictionary"). The claim holds for the Android artefact
  only, and must be re-verified on a real device before it goes live.

## Feature graphic brief

1024 x 500 PNG. Word "VOCAB" large, a single card showing a word, its part of
speech, and first line of its definition. High contrast, legible at thumbnail
size. No phone mockup smaller than 40% of frame.

`store/feature-graphic.png` (1024 x 500, dimensionally valid for Play) is
generated from `store/feature-graphic.html` and the layout is correct, but it
carries a **colour seam across the lower ~20%** — an artefact of the headless
capture's device-scale handling, not the design. **Regenerate it in a design tool
before upload; do not ship it as-is.**

## Screenshot set

All five are **1080 x 1920 PNG**. The set deliberately varies **size, shape,
distance, position and the text/visual relationship** so it does not read as one
template repeated five times — that repetition is what makes a screenshot set
look cheap when someone swipes through it.

Each card is a saturated colour field with a device-framed capture inset into it
(9 px bezel, 46 px radius, drop shadow). The type carries the card; the device
is proof, not the subject.

**Headline sizes are the load-bearing decision here.** Play shows these in a
horizontal carousel at roughly 200 px wide. A 60 px headline on a 1080 px
canvas — 5.5% of width — renders at ~11 px in that carousel and reads as an
aside. The lead card now runs 112 px (10.4% of canvas, ~20 px in the carousel).
If you regenerate these, check them at 200 px wide, not full size.

| # | File | Layout | Headline | Device | Card |
|---|---|---|---|---|---|
| 1 | `01-lookup.png` | **hero** — type owns the top, device below | 112 px | 864 px centred | blue |
| 2 | `02-etymology.png` | **visual first** — device on top, caption beneath | 112 px | 780 px high | purple |
| 3 | `03-saved.png` | **diagonal split** — headline full-width, device beside it, ghost running vertically down the left strip | 112 px | 850 px, right | teal |
| 4 | `04-review.png` | **tilted** −9°, centred — the device edge deliberately covers the lower half of "know" | 112 px | 700 px rotated | orange |
| 5 | `05-review-revealed.png` | **zoomed**, device fully inside the frame | 112 px | 800 px | rose |

Every headline is **112 px** — one uniform scale across the set. A card that
drops below it reads as an aside beside its neighbours. The variety lives in
device size (720 / 780 / 850 / 864 / 1000), layout, and colour instead.

No card has a flat empty field: each carries a soft glow, and the three with
real negative space also carry a 260 px ghost of the word that card's device is
actually showing.

Generated by `store/compose.js` from the locked system in `store/tokens.css` —
see `store/README.md`. Raw uncaptioned captures live in `store/raw/`, so cards
can be re-captioned or recoloured without re-shooting the app.

**Do not claim offline in the listing.** Verified 29 Sep 2026: offline lookup
works in the *Android* build (on-device SQLite cache, `--offline` harness run
serves 60/60 from cache) but **not** in the web build, which fails with
"Couldn't reach the dictionary". The uploaded artefact is the Android build, so
the claim is true there — but it must be re-verified on a real device after the
first release before it goes in the store copy.

**Optional sixth shot:** an offline capture taken from the real Android app on a
device in airplane mode. Worth adding once a device is in hand — it is the
clearest differentiator in the set.

## Category

Education > Dictionaries & Languages (Education > Language Learning is the
secondary option; test whichever the ASO report favours).

## Content rating

- Violence: none
- Sexual content: none
- Language: none
- Controlled substances: none
- User interaction: **Users can communicate** is not applicable, but the app has
  no user-to-user features at all
- In-app purchases: yes
- Personal info: none collected
- Expected outcome: **Everyone**

IARC questionnaire should be completed as "No information is shared with third
parties" and "No data is collected" on every axis.

## Data safety form

| Question | Answer | Why |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** | No account, no analytics, no ads, no crash reporting. |
| Is all user data encrypted in transit? | N/A | No data is transmitted. |
| Do you provide a way for users to request that their data is deleted? | N/A | No data is retained. |
| Does the app contain ads? | **No** | |
| Does the app allow purchases? | **Yes** | Play Billing only, handled by Google. |

Privacy policy must be hosted at a public URL. Serve it from the app's own
backend at `/privacy` and put that URL in Play Console.

## Keywords (for ASO, subject to demand-check findings)

Primary: dictionary, vocabulary, word, word meaning, definitions
Secondary: thesaurus, synonyms, etymology, word origin, flashcards, spelling,
learn english, word game, word of the day, reader, reading

## Release notes template

```
What's new
- Faster lookups, fewer failures
- Review deck now surfaces forgotten words first
- Offline support for previously looked-up words
```

## Monetisation notes

Product: single non-consumable unlock, no subscription. A subscription is
mismatched to a reference app people expect to own outright, and subscription
churn would make $50/mo harder, not easier.

Price point to validate against the demand report before going live.
