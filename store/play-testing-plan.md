# Google Play testing & launch plan

What actually stands between the current build and a public listing, and what
needs a human to do.

## The requirement is real, and it's on you, not on the build

Source: [App testing requirements for new personal developer
accounts](https://support.google.com/googleplay/android-developer/answer/14151465)

> "Developers with personal accounts created after November 13, 2023, must run a
> closed test for their app with a minimum of 12 testers who have been opted in
> continuously for at least 14 days."

Details that matter:

- **12 testers minimum**, opted in **continuously for 14 days**. Someone who opts
  out and back in restarts their 14 days.
- After the 14 days you **apply for production access** and answer three sections
  (about your closed test / your app / production readiness).
- Review **usually takes seven days or less**, occasionally longer.
- Google may require you to *continue* testing if you have under 12 opted-in
  testers or thin engagement.

**Realistic earliest timeline: ~14 days of testing + up to ~7 days review ≈ 3–4
weeks** from the day your first 12 testers opt in.

### This does not apply if

- You register as an **organisation** rather than a personal account. Organisation
  accounts use a different production-access questionnaire and do not carry the
  12-tester/14-day gate. This needs a real company with a D-U-N-S number, so it is
  only relevant if you have one.
- You already had a Play account with apps published before 13 Nov 2023. You would
  know if this were you.

## What I cannot do, and why

**I will not create tester accounts.** Faking testers violates the Play Developer
Program Policy, and the goal this project runs under explicitly forbids review
manipulation and fake ratings. Beyond the policy risk, Google asks you to
describe how you recruited testers and how they engaged — a fabricated tester
base is exactly the kind of thing that gets an account actioned, and it would
jeopardise the account permanently. I am not willing to spend your account on
that, and it is not a shortcut that works.

I also cannot create a Google Play Developer account for you: it requires identity
verification, a legal agreement, and a payment method in your name.

## What I have done instead

- Built and verified the release AAB, so the closed test can start the moment an
  account exists.
- Written the tester recruitment copy in `store/tester-recruit.md` — ready to
  post wherever you choose.
- Written the Play Console answers in `store/production-access.md` — the exact
  questions Google asks, answered honestly, with placeholders for the real tester
  feedback.

## Two legitimate ways to fill 12 slots

### Option A — real testers you know (free)

The method Google itself recommends: friends, family, colleagues, classmates,
and online communities. For a dictionary app, natural homes are r/androidapps,
r/androiddev, r/english, r/books, and reading-related Discords.

The friction is that strangers often test for a day and drop out, and a dropout
costs you the 14-day clock. Tell people up front what you are asking for.

### Option B — paid real testers (~$20–40, one-off)

Legitimate services supply **real** people with real Google accounts. This is the
fast, low-risk path, and it is well under the project's spend cap.

- [Testers Community](https://www.testerscommunity.com/blog/google-play-closed-testing-requirements-2026) — quotes the current 12/14 rule directly
- [PrimeTestLab](https://primetestlab.com/blog/production-access-questionnaire-answers) — advertises 12 pre-qualified testers for $19.99

**Check before paying:** confirm they are real accounts, that testers stay opted in
for the full 14 days, and that they do not leave incentivised ratings. Ask what
happens if a tester drops out. Never pay for ratings or installs — that is the
line that gets an account banned.

Your budget cap for this project is $10/mo, and a one-off $20–40 for the launch
gate is the single highest-leverage spend available: without it there is no
listing at all.

## Launch sequence

1. Create the Play Developer account (personal, $25 once).
2. Upload `android/app/build/outputs/bundle/release/app-release.aab` to **internal
   testing** first — no requirements, instant availability. Smoke-test on a real
   device.
3. Create a **closed testing** track and add 12+ testers.
4. **Wait 14 continuous days.** Do not ship a new AAB that resets anything; builds
   can be updated during the window.
5. Answer the production-access questionnaire (`store/production-access.md`).
6. Publish to **open testing** first, then production.

## Open testing matters

Once you have production access, open testing makes the app joinable by anyone
from the store listing. That is the cheapest ongoing acquisition channel and the
main reason this project can work without paid marketing — so keep the listing
live in open testing and update it.

## Caveat on the revenue target

The `$50/mo` goal in `docs/demand-check.md` assumes a 0.5–1% free-to-paid
conversion that is **an assumption, not a measurement**. The 14-day closed test is
a free opportunity to check the assumption cheaply: ask testers what they would
pay for, and whether they would use the review-history and smart-review features
at all. Real answers now are worth more than a projection refined later.
