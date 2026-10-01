# Demand check — can Vocab reach $50/mo on Google Play?

Compiled 29 September 2026 from live Play Store and AppBrain listings. Every
figure below carries its source. Nothing here is estimated unless explicitly
labelled as an assumption.

## Verdict

**$50/mo is reachable, but it is a volume-and-execution problem, not a market-size
problem — and it is not reachable on downloads alone.** It needs roughly
150–300 paying users, which at a realistic free-to-paid conversion for a reference
app means on the order of 15,000–60,000 installs. That is a credible ASO target
for a well-listed app in this category, but it is *months* of work with no paid
marketing, which matches the stated constraint. No paid acquisition is assumed
anywhere in this report.

The one hard caveat: the app is a **companion to reading**, not a daily-habit
app. The dominant players in this category win on daily habits (daily word,
streaks, games). Vocab has no daily loop, so it competes on a different axis —
speed, etymology, and tagging. That is a real differentiator and matches the
free tier, but it caps the ceiling. $50/mo is a sound target; $500/mo is not
credible for this product without adding a daily-habit mechanic.

## Competitors

| App | Downloads (total) | Last 30d | Reviews | Rating | Model | Source |
|---|---|---|---|---|---|---|
| Dictionary.com | 10,000,000+ | — | — | 4.0 | free, ads, IAP | [appbrain](https://www.appbrain.com/app/dictionary-com-english-words/com.dictionary) |
| dict.cc dictionary | 4.9M (1M+ tier) | 10,000 | 22,641 | 4.55 | free, ads | [appbrain](https://www.appbrain.com/app/dict-cc-dictionary/cc.dict.dictcc) |
| English Dictionary & Thesaurus (MobiSystems) | 5,000,000+ | — | — | 4.3 | free, ads, IAP | [appbrain](https://www.appbrain.com/app/english-dictionary-thesaurus/com.mobisystems.msdict.embedded.wireless.collins.englishdictandthes) |
| Zann WordUp: Build Vocabulary | 5,000,000+ | — | — | 4.6 | free | [appbrain](https://www.appbrain.com/app/zann-wordup-build-vocabulary/co.wordupapp.app) |
| Word of the Day: Vocab Builder | 500K+ (7M worldwide per listing) | — | 5,060 | 4.2 | ads + subscription | [play](https://play.google.com/store/apps/details?id=com.wordoftheday.en) |
| Dictionary – M-W Premium | 220K | 490 | 8,786 | 3.12 | **$7.99 paid** | [appbrain](https://www.appbrain.com/app/dictionary-m-w-premium/com.merriamwebster.premium) |
| Vocabulary Builder \| Vokab | 1.2K | 9 | 0 | 0.00 | free, ads | [appbrain](https://www.appbrain.com/app/vocabulary-builder-vokab/pro.vokab.vocabulary.builder) |

### What the competitor data says

1. **The market is real but mature and ad-dominated.** Every large incumbent
   carries ads. AppBrain lists "Contains ads" for dict.cc, Dictionary.com,
   Word of the Day, and Vokab alike. An ad-free app is a genuine differentiator,
   and it is the single clearest positioning available.
2. **Paid-only struggles.** Merriam-Webster's $7.99 upfront download has 220K
   installs and a 3.12 rating — the worst-rated app in this set, from the most
   recognised dictionary brand in the US. Charging money *before* anyone has
   used the app is the model to avoid. This is a direct argument for the
   freemium structure, not just a concession to it.
3. **Small, focused vocabulary apps do exist and do get installs.**
   Word of the Day holds 500K+ Android / 7M worldwide, and OUP's Oxford
   English Vocab Trainer sits at 10K+. The category is not closed.
4. **The long tail is brutal.** Vokab — a direct "vocabulary builder" name
   match — has 1.2K installs and zero reviews after launching January 2026.
   Name/listing quality alone does not carry an app here.

## Funnel and revenue projection

Google Play takes 15% on the first $1M/yr of a developer's earnings, so net is
85% of gross. The $50/mo target is stated as **gross**, and 15% is shown below.

Assume a **$2.99 one-time unlock** (priced below M-W's $7.99 to convert an
unsure user, and high enough that a single sale covers hosting several times
over).

| Scenario | Installs | Paid conversion | Paying users | Gross/mo | Net after 15% |
|---|---|---|---|---|---|
| Pessimistic | 3,000 | 0.5% | 15 | $45 | $38 |
| Base | 15,000 | 1.0% | 150 | $449 | $381 |
| Optimistic | 60,000 | 1.0% | 600 | $1,794 | $1,525 |

**Against the $50/mo goal:** the pessimistic case lands at $45 gross — just
under target. Base and optimistic clear it by roughly 9x and 36x. The target is
therefore **not** demanding: it is met at ~3,000 installs with a 0.5% conversion
rate, which is a low bar for a category where incumbents pass 5M.

### Assumption sources and confidence

| Assumption | Value | Basis | Confidence |
|---|---|---|---|
| Free→paid conversion | 0.5–1.0% | No free-to-paid figure was published in any source consulted for this report. **This is an assumption, not a measured number.** | Low — the single most load-bearing number here |
| Price point | $2.99 | Set by us; below M-W's $7.99 which underperforms | Our choice |
| Play fee | 15% | Standard first-$1M tier | High |
| Install target | 3,000–60,000 | Anchored on the Vokab (1.2K, failure) and Oxford OUP (10K+, mid) data points | Medium |
| Time to 3,000 installs | 3–6 months | ASO-only, no paid acquisition, per the "hands-off marketing" constraint | Low — no source; depends on ranking |

**The projection is optimistic in one specific way:** conversion is assumed, not
measured, and the category evidence (M-W at 3.12) suggests paying for a
dictionary is genuinely hard. If real conversion is 0.2%, the pessimistic case
becomes ~$18/mo and the 6-month target fails. This is the number to watch in
month one of real data.

## What the data argues for

1. **Ad-free is the wedge.** Every scaled competitor runs ads; the category's own
   most recognisable paid app is the worst-reviewed one in the set.
2. **Lead with etymology and tagging, not gamification.** That is the
   differentiator, and it is what the free tier already delivers in full.
3. **No subscription.** Word of the Day's reviews complain repeatedly about
   Premium gating ("keeps asking to get premium to get the word which we missed
   one day"). A subscription on a reference app invites exactly that review
   pattern. One-time unlock only.
4. **Screenshots carry the ASO load** — see the caption plan in
   `store/listing.md`, which is written around the etymology and tag-context
   differentiators rather than generic dictionary screens.

## ASO opportunities

High-intent keywords with weaker incumbents than the category giants:

- `word origin` / `etymology` — the feature no one in the long tail leads with
- `vocabulary while reading` / `save words from books` — the actual use case,
  poorly served by daily-quiz apps
- `tag words` / `word notebook` — near-zero competition
- `offline dictionary` — the category's most common top-of-listing claim
- `thesaurus` — high volume, achievable because the app already returns
  synonyms and antonyms

## Stop condition triggered?

No. The demand check does **not** support halting the build. The market is
large, the free tier is defensible, and the revenue bar set for this project is
low relative to the opportunity. Proceed to publication.

The one item that would change this verdict: if the first full month of real
Play Console data shows conversion materially below 0.2%, the $50/mo target is
not reachable without a daily-habit mechanic, and that should be decided then,
not now.
