# Vocab Android

Capacitor Android project for the Vocab vocabulary builder.

## Prerequisites

- A JDK that Gradle 9.1.0 supports — verified with JDK 25 (Temurin 25.0.0.36).
  Gradle 8.14.x fails on JDK 25 with "Unsupported class file major version 69",
  which is why the wrapper is pinned to 9.1.0.
- Android SDK with platforms 35/36/37 and build-tools 35.0.0–37.0.0
- `JAVA_HOME` and `ANDROID_HOME` environment variables set

## Build Commands

```bash
# From repo root (A:/dev/vocab)
npm run android:sync      # Sync web assets and plugins
npm run android:bundle    # Build signed AAB (requires signing.properties)
npm run android:clean     # Clean build
npm run android:open      # Open in Android Studio
```

## Release Signing

The release build requires a **signing.properties** file at `android/signing.properties` (gitignored) with:

```
storeFile=keystore/upload.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=vocab-upload
keyPassword=YOUR_KEY_PASSWORD
```

`storeFile` is resolved relative to `android/` (the Gradle rootProject dir), not `android/app/`.

### Generating the Upload Keystore

Run this once (keep the generated `.jks` file safe — it's your upload key for Google Play):

```bash
cd android
keytool -genkeypair -v \
  -keystore keystore/upload.jks \
  -alias vocab-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Vocab, OU=Engineering, O=Krocosr, L=City, S=State, C=US"
```

Then create `android/signing.properties` with the values above.

**Never commit** `signing.properties` or `*.jks` / `*.keystore` files.

## Local-First Architecture

This Android app works without any backend server:

- **Saved words, tags, review history** → stored in on-device SQLite (via `@capacitor-community/sqlite`)
- **Dictionary lookups** → fetched directly from `dictionaryapi.dev` at runtime
- **Suggestions** → sourced from locally saved words only

The frontend uses a single storage abstraction (`public/store.js`) that auto-detects Capacitor native vs web and routes to the appropriate implementation.

## Project Structure

```
android/
├── app/                    # Main app module
│   ├── build.gradle        # App-level Gradle config (signing, SDK versions)
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── assets/public/  # Web assets (synced from ../public)
│   │   └── java/com/krocosr/vocab/MainActivity.java
│   └── capacitor.build.gradle  # Generated — do not edit
├── capacitor-cordova-android-plugins/  # Capacitor plugin modules
├── build.gradle            # Root Gradle config (AGP 8.13.0)
├── variables.gradle        # SDK versions (minSdk 24, compile/targetSdk 36)
├── settings.gradle
├── gradle.properties
├── gradlew / gradlew.bat   # Gradle wrapper
└── signing.properties      # Gitignored — create locally for release builds
```

## Troubleshooting

### Gradle fails with "SDK location not found"
Set `ANDROID_HOME` to your Android SDK path (e.g., `%LOCALAPPDATA%\Android\Sdk` on Windows).

### `bundleRelease` fails with "Keystore not found"
Create `android/signing.properties` per the instructions above.

### SQLite plugin errors
Ensure `@capacitor-community/sqlite` is synced: `npm run android:sync`.

### Cleartext traffic errors
The app uses `androidScheme: "https"` in `capacitor.config.json` and `allowMixedContent: true`. Dictionary API calls go to `https://api.dictionaryapi.dev` — no cleartext.