# Sideload the app (no Play needed)

You do not have to wait for Play to try this on your own phone. A signed
release APK is built and can be installed directly.

## What you have

| File | Use |
|---|---|
| `android/app/build/outputs/apk/release/app-release.apk` | install directly on a phone |
| `android/app/build/outputs/bundle/release/app-release.aab` | upload to Play (AAB is what Play wants) |

The APK is signed with the same upload key, `com.krocosr.vocab`, minSdk 24
(Android 7.0), targetSdk 36.

## Install it

**Android phone**, easiest route:

1. Copy the APK to the phone (USB, Drive, email to yourself, whatever).
2. Tap it in Files.
3. Android will warn: install from unknown sources. Allow it for the app you
   tapped it with, then install.
4. Open Vocab.

**adb**, if you have the platform tools:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.krocosr.vocab/.MainActivity
```

**From a terminal on Windows:**

```sh
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" install -r A:/dev/vocab/android/app/build/outputs/apk/release/app-release.apk
```

## Be a real tester

This matters more than it sounds. Google's production-access form asks how
testers used the app and what they said. You are the first one, and a
thoughtful account of your own experience is worth a lot there — see
`store/production-access.md`.

Worth checking specifically:

- **A cold lookup on mobile data.** First lookups average about 3.3s because the
  free dictionary APIs are slow and sometimes rate-limit. Look up a word you've
  never looked up. If it spins forever, that is a bug worth reporting to me
  immediately — it is the single most likely thing to annoy a reviewer.
- **Offline.** Look up a few words with Wi-Fi on, then turn Wi-Fi off and look
  them up again. They should still appear. (This is on-device cache, and it
  works in the Android build but not the web build.)
- **The review deck.** Reveal a card, tap Again / Knew it, check the Saved page.
- **Rotation and back gesture.** The bottom tab bar is fixed; make sure it
  behaves.

Then tell me what confused you. Screenshots of anything broken are ideal.

## What to expect, honestly

- No sound on lookups. Audio was only ever available from an API that is
  currently down, so the speaker button is hidden rather than broken.
- First lookup of any word can take a few seconds. Later ones are instant.
- The Upgrade button is visible but will not do anything until the Play billing
  product exists. That is expected, not a bug.

## Do not do this

Sideloading is fine for your own testing. It is **not** a way to distribute the
app to others or to seed a Play review, and it will not get you into anyone's
store listing. The Play closed test is still required for public release — see
`store/play-testing-plan.md`.
