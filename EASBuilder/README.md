# EAS Builder

A React Native app for triggering EAS builds and submitting to TestFlight directly from your phone.

## What it does

1. **Connect** your Expo and GitHub accounts via personal access tokens (stored securely on device)
2. **Pick** a GitHub repo and branch
3. **Configure** platform (iOS, Android, or both), build profile, and options
4. **Launch** an EAS build with optional auto-submit to TestFlight
5. **Monitor** live build progress with step-by-step status

---

## Prerequisites

Before this app can trigger builds, your target project needs to be set up for EAS **once from a terminal**:

```bash
# In your project directory
npx eas build:configure
```

This creates an `eas.json` and sets a `projectId` in `app.json`. After that, everything can be done from this app.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your tokens

**Expo personal access token**
- Go to [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
- Create a token with `build:create` permission
- Copy it — you'll paste it into the app on first launch

**GitHub personal access token**
- Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
- Select `repo` scope (needed to list repos and branches)
- Copy it

### 3. Run locally

```bash
npx expo start
```

Scan the QR code with Expo Go, or run on a simulator.

---

## Building & deploying this app itself

Update `app.json` with your own bundle identifier and app name first:

```json
{
  "expo": {
    "name": "EAS Builder",
    "slug": "eas-builder",
    "ios": {
      "bundleIdentifier": "com.yourname.easbuilder"
    }
  }
}
```

Then run:

```bash
# Set up EAS for this project
npx eas build:configure

# Build for TestFlight
npx eas build --platform ios --profile production --auto-submit
```

---

## Project structure

```
app/
  _layout.tsx      # Root navigator
  index.tsx        # Splash / auth check
  setup.tsx        # Token entry screen
  repos.tsx        # GitHub repo + branch picker
  configure.tsx    # Build options
  building.tsx     # Live build progress
  history.tsx      # Recent builds

components/
  UI.tsx           # Shared components (Button, Card, StatusBadge…)

lib/
  easApi.ts        # EAS GraphQL API calls
  githubApi.ts     # GitHub REST API calls
  storage.ts       # Secure token storage
  theme.ts         # Colors, spacing, radius constants
```

---

## Notes

- Tokens are stored using `expo-secure-store` (iOS Keychain / Android Keystore) — never in plaintext
- Build status polls every 12 seconds automatically
- The EAS GraphQL API (`api.expo.dev/graphql`) is used directly — no backend required
- Auto-submit to TestFlight requires your Apple credentials to already be configured in your EAS project
