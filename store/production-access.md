# Production access questionnaire — prepared answers

Play Console's production-access form has three sections. These are drafted to
be **true** for this project. Fill in the bracketed parts from your actual test
period — do not submit the placeholders.

Review usually takes seven days or less.

## Part 1 — About your closed test

**How easy was it to recruit testers?**
> [Pick honestly. Most indie developers pick "Somewhat difficult" or "Difficult".
> The 14-day continuous opt-in requirement is genuinely restrictive for a solo
> developer with no existing audience — do not claim it was easy.]

**Did testers use all available features?**
> Yes for the core loop — lookup, save, tag, and the review deck. The paid
> features (review history, smart review, export) were not available during the
> closed test because the Play billing product had not been created yet. Testers
> were told they are coming and which ones were planned.

**Did tester usage match expected production behaviour?**
> [Fill in after the test. Useful things to note: how many testers looked up more
> than one word; whether anyone saved and came back to review; whether the
> dictionary's occasional slow first lookup drew complaints — the app is backed by
> free community APIs, and cold lookups average around three seconds, which is
> the most likely source of friction you will see.]

**Summarise the feedback received and how it was collected.**
> [Fill in after the test. Keep it concrete: what people actually said, what you
> changed as a result. Generic text reads as low engagement and can trigger a
> request for more testing.]

## Part 2 — About your app

**Target audience — be specific.**
> English speakers who read long-form text and meet unfamiliar words while
> reading: books, articles, and papers. Secondary audience: people studying for
> literacy-based exams who want word origins, not just definitions. Primarily
> adults 18+, but the app carries an Everyone rating and works for any age.

**Value proposition.**
> Vocab is a dictionary built around the moment you actually need it — mid-sentence,
> while reading. Two things distinguish it from the large incumbents. First, word
> origins are a first-class section rather than an afterthought, because knowing
> where a word came from is the fastest route to remembering it. Second, saved
> words can be tagged with where you found them — a book title, an article — so
> review shows the word in the context you met it. It is ad-free, has no account
> system, and collects no data. The free tier includes unlimited lookups,
> unlimited saves, and the full review deck; a one-time purchase adds review
> history, smart review, and export.

**Estimated install range, first year.**
> Pick a figure you can defend against your actual first-month data. Be
> consistent with the projection in `docs/demand-check.md`, which models roughly
> 3,000 installs at the low end. Do not inflate this — Play compares it to real
> store performance.

## Part 3 — About your production readiness

**What changed based on the closed test?**
> [Fill in after the test. Have the list ready: bugs fixed, UI changes, wording
> changed. Be specific — "fixed the review buttons being hidden behind the tab
> bar on small screens" is credible; "improved quality" is not.]

**How did you determine the app was ready?**
> [Fill in after the test. Useful evidence you can legitimately cite:]
> - `npm run selfcheck` and a live variant pass on every change
> - a lookup reliability harness over a fixed 200-word corpus, run three times
>   consecutively: 200/200 resolved with zero user-visible failures
> - a forced-offline run serving 60/60 words from the on-device cache with
>   networking blocked
> - manually exercised lookup, save, tag, and the full review flow in a real
>   browser and on-device
> - Play Console pre-launch report reviewed

## Before you apply

- [ ] 12+ testers opted in **continuously** for 14 days (no gaps)
- [ ] A pre-launch report has been reviewed and acted on
- [ ] Privacy policy is live at a public HTTPS URL (yours serves at `/privacy`)
- [ ] Data safety form matches reality: no data collected, no ads, purchases via
      Play Billing only
- [ ] Content rating questionnaire completed
- [ ] Screenshots are the current 1080x1920 set in `store/screenshots/`
- [ ] Feature graphic regenerated — the current one has a known colour seam
      (see `store/listing.md`)

## Two things to do before anything else

1. **Create the billing product** `vocab_pro_unlock` in Play Console and attach it
   to a licence. Without it the Upgrade button leads nowhere. See
   `docs/monetization.md`.
2. **Ask testers about willingness to pay** during the closed test. The revenue
   projection rests on an assumed 0.5–1% conversion. This is the cheapest moment
   you will ever get to test that assumption with real users.
