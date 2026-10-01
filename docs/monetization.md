# Monetisation — freemium split

Product: **one-time unlock, no subscription.** Price: **$2.99**, approved by the
project owner 29 Sep 2026. Set the actual price in Play Console; this repo only
declares the product id (`vocab_pro_unlock`).

## Why not a subscription

Word of the Day — the closest scaled competitor — is subscription-based, and its
own Play reviews repeatedly complain about it:

> "it keeps asking to get premium to get the word which we missed one day and to
> play second level of any game" (1 review, 12 Sep 2026)

A subscription on a reference app people open to look things up generates exactly
that reaction. The paid alternative in this category, Merriam-Webster Premium
($7.99 upfront), has the **worst rating in the competitor set at 3.12**. The
evidence says: charge once, after value is proven, never before.

## The split

`public/entitlements.js` owns the feature list; `PRO_FEATURE_LIST` is the single
source of truth.

| Feature | Free | Pro |
|---|---|---|
| Unlimited lookups | yes | yes |
| Unlimited saved words | yes | yes |
| Tag words by source | yes | yes |
| Full review deck | yes | yes |
| Works offline | yes | yes |
| Review history / stats | — | Per-word review log (outcome + timestamp), paginated history view |
| Smart review (forgotten-words-first scheduling) | — | Wrong-answers-first queue with recency weighting; toggle in Review |
| Export saved list | — | CSV export from Saved view; respects the active tag filter |

**The free tier is the whole app.** Lookups, saving, tagging, review, and offline
all work indefinitely without paying. That is the freemium promise in
`store/listing.md` and it is enforced by `FREE_FEATURES` in `entitlements.js`, not
just claimed in copy.

Pro adds *power tools for people already using the app daily*, not the ability to
use it at all. Nothing a first-time user needs is behind the gate.

## Where the paywall appears

One control only: an `Upgrade` button in the footer, shown when all of the
following hold:

- running in the Android build (`Capacitor.isNativePlatform()`), so the web and
  self-hosted versions never show a purchase affordance they cannot honour
- the entitlement refresh says the user has not purchased

It is hidden entirely once purchased, and there are no interstitial popups,
upgrade nags, or limited-time counters. Deliberately: nag-driven conversion
produces the one-star reviews that sink a new listing's ranking.

## Implementation

- `public/entitlements.js` — feature lists, `refreshEntitlement()`,
  `purchase()`, `isPro()`, `hasFeature()`, `onEntitlementChange()`
- Wired into `public/app.js` via `mountUpgrade()`
- Plugin: `capacitor-billing` (already in `android/` and `build.gradle`)

Behaviour on failure, both deliberate:

- `queryPurchases` failing (e.g. no network) is treated as **free, not unlocked**.
  A connectivity blip must never lock a user out of their purchase.
- A cancelled purchase sheet returns `false` and restores the button label.

## Server endpoints backing the Pro features

The web build and the self-hosted server need these; the Android build reads
SQLite directly and does not call them.

| Endpoint | Purpose |
|---|---|
| `GET /api/words/:word/reviews` | per-word review log for the history view |
| `GET /api/review/smart` | missed-words-first review queue |

Backed by a new `reviews` table in `src/db.ts`; `POST /api/words/:word/review`
writes the aggregate counters and the history row together.

Smart ordering: words actually missed come first (lowest known-ratio), then
partially-known, then never-reviewed. A never-reviewed word is *unmeasured*, not
"0% known" — treating it as zero would let it swamp every real miss, which was
the original bug.

## Verification status

| Item | Status |
|---|---|
| Free tier has no Pro affordances | **Verified** in a real browser: no export button, no History nav, no Smart toggle |
| Free user navigating to `#/history` is blocked | **Verified**: redirects to `#/`, history view stays hidden and empty |
| `FREE_FEATURES` all granted free | **Verified** via `hasFeature()` |
| `GET /api/words/:word/reviews` | **Verified** live; returns recorded outcomes |
| `GET /api/review/smart` | **Verified** live; orders by known-ratio, differs from the free queue |
| Free review queue unchanged | **Verified** identical to pre-change ordering |
| Upgrade button hidden on web | **Verified** — removed from the DOM, not just hidden |
| Pro UI rendering when unlocked | **NOT verified** — needs a real Play purchase; see below |
| Purchase flow end-to-end | **NOT verified** — no Play Console product exists yet |


## Play Console setup required

1. Create a one-time product with id `vocab_pro_unlock` (or set
   `VOCAB_PRO_PRODUCT_ID` before build). The id is read from
   `public/entitlements.js`.
2. Attach it to the app's base licence or a licence active track — a paid
   product on the default free app is not sellable to all users.
3. Billing permission is already declared by `capacitor-billing`.

Not yet done: the product does not exist in Play Console, so the purchase path
cannot be exercised end-to-end. That requires a Play developer account, which is
a stop condition for this project. Once the product exists, the verification is:
install the release build, tap Upgrade, complete a test purchase through Play
licence testers, confirm the button disappears and the Pro features unlock after
an app restart.
