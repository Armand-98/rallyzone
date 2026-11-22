# RallyZone

Privacy-first journaling and emotional regulation app for veterans and people in high-stress work. Live on the App Store.

## Features

- Morning and evening brief with mood log and 30-day heatmap
- Trigger log: event, reaction, intensity
- Calm tools and a crisis resource rail
- Secure Vault behind Face ID / biometrics (premium)
- Pattern insights and PDF export (premium)

## Privacy

Entries are stored on the device in SQLite. There is no account and no backend holding journal data.

## Stack

| Layer | Tool |
|---|---|
| Framework | React Native, Expo SDK 54, Expo Router |
| Language | TypeScript |
| Storage | expo-sqlite, expo-secure-store |
| Auth | expo-local-authentication |
| Subscriptions | RevenueCat |
| Build | EAS Build and EAS Submit |

## Run locally

```bash
npm install
npx expo start
```

## Note on keys

`constants/keys.ts` holds RevenueCat public SDK keys. They are designed to be embedded in the client app and grant no access to account data.
