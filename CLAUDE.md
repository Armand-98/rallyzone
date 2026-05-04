# RallyZone — Project Brief

## What This App Is
RallyZone is a mental performance and emotional regulation app built for veterans and high-stress individuals. It is a React Native / Expo application targeting Android (primary) and iOS (secondary). The app is in active production — real users are currently testing it on the Play Store.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native via Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Local DB | expo-sqlite (SQLite, sync API via `getDb()`) |
| Auth | expo-local-authentication (Face ID / biometrics) |
| Secure storage | expo-secure-store |
| Subscriptions | RevenueCat (`react-native-purchases` v10) |
| PDF export | expo-print + expo-sharing |
| Build / deploy | EAS Build + EAS Submit |
| Language | TypeScript |

---

## Project Structure

```
app/
  (tabs)/
    index.tsx       — Morning/Evening Brief screen (mood log + 30-day heatmap)
    log.tsx         — Trigger Log screen (event + reaction + intensity entry)
    calm.tsx        — Calm tools screen
    profile.tsx     — Profile / settings screen
  vault.tsx         — Secure Vault (premium, biometric-gated)
  insights.tsx      — Pattern Insights (premium)
  export.tsx        — PDF Export (premium)
  paywall.tsx       — RevenueCat paywall screen
  onboarding/       — Onboarding flow
  privacy.tsx       — In-app privacy policy
  privacy-policy.html

components/
  PremiumGate.tsx   — Wraps premium screens; redirects non-subscribers to paywall
  CrisisRail.tsx    — Crisis resource rail component

hooks/
  useRevenueCat.ts  — Subscription state (isPremium, customerInfo, loading)
  useVault.ts       — Vault CRUD + biometric auth
  useInsights.ts    — Aggregated mood/trigger analytics
  usePDFExport.ts   — PDF generation logic

db/
  index.ts          — DB singleton (promise-based, prevents cold-boot race condition)
  moodEntries.ts    — Mood entry CRUD
  triggerLogs.ts    — Trigger log CRUD
  groundingAndPrefs.ts — Grounding sessions + user prefs
  prefs.ts          — Async prefs layer (used by onboarding/profile)
```

---

## Database

- Engine: SQLite via `expo-sqlite` (sync API)
- Singleton: `getDb()` in `db/index.ts` — opens once, reuses connection
- Migrations: append-only array in `db/index.ts`. NEVER edit or remove existing migrations. Add new ones by appending to the array — version is auto-tracked via `PRAGMA user_version`.
- Tables: `mood_entries`, `trigger_logs`, `grounding_sessions`, `user_prefs`

---

## Subscription / Monetization

- Provider: RevenueCat
- Entitlement ID: `premium`
- Hook: `useRevenueCat()` returns `{ isPremium, customerInfo, loading }`
- Gate component: `<PremiumGate>` — wraps any premium screen; shows lock UI + "Unlock Premium" button if not subscribed
- Gated features: Vault, Insights, PDF Export
- API key stored in `constants/keys.ts` (not committed)

---

## Build & Deployment

### EAS Profiles (`eas.json`)
| Profile | Platform | Output |
|---|---|---|
| `development` | Android | APK (internal) |
| `preview` | Android | APK (internal distribution) |
| `production` | Android | AAB (Play Store) |
| `production` | iOS | IPA (App Store) |

### Android
- Package: `com.lyfield.rallyzone`
- Play Store: submitted, currently in internal testing track
- Build: `eas build --platform android --profile production`
- Submit: `eas submit --platform android --profile production`

### iOS
- Bundle ID: `com.lyfield.rallyzone`
- Build number: 1
- Apple ID: `ArmandZavala98@icloud.com`
- App Store Connect App ID: `6765824870`
- Apple Team ID: `PYB4DPZ6J3`
- EAS Project ID: `e63ad189-0a01-40c3-b59e-2564aa8750a2`
- Status: Config complete, build + submission not yet executed
- Build: `eas build --platform ios --profile production`
- Submit: `eas submit --platform ios --profile production`

---

## Completed Phases

### Phase 01 — Foundation
- App icon, splash screen, dark theme (`#111110` background throughout)
- Privacy policy (hosted + in-app)
- Onboarding flow with call sign setup

### Phase 02 — Core Features
- Morning/Evening Brief (mood, energy, sleep — 5-point scales)
- 30-day mood heatmap with average badge
- Trigger Log (event, reaction, intensity 1–10, optional reflection)
- Calm tools tab
- Profile tab
- SQLite DB with versioned migrations

### Phase 03 — Monetization & Premium
- RevenueCat integrated + configured
- Paywall screen
- PremiumGate component wired to all premium routes
- Secure Vault (biometric-gated, encrypted notes via expo-secure-store)
- Pattern Insights (aggregated mood/trigger analytics)
- PDF Export (30/60/90-day report with call sign and role)
- EAS Build config for both platforms
- Play Store AAB submitted

---

## Current Status (as of 2026-05-01)

- Branch: `master` — all changes pushed to remote (`Armand-98/rallyzone`)
- App version: `1.0.0`
- Active testers: real users on Play Store internal track
- iOS: build config committed, build/submit not yet run
- No open bugs or known issues

---

## Key Decisions & Constraints

- Dark-only UI (`userInterfaceStyle: dark`) — no light mode support
- Tablets not supported (`supportsTablet: false`)
- No camera or photo library access — permissions declared as unused in iOS plist
- DB uses sync API (`getDb()` not `getDB()`) — the async version (`db/prefs.ts`, `db/index.ts getDB()`) is a legacy layer; primary app code uses the sync singleton
- `newArchEnabled` and `reactCompiler` were removed from `app.json` to resolve build issues
- `predictiveBackGestureEnabled` and `edgeToEdgeEnabled` removed from Android config for Play Store compatibility
