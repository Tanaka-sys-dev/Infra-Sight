# Sprint 2 Notes

## Scope

Sprint 2 adds Firebase Authentication integration on the frontend and Firebase Admin SDK / Firestore integration on the backend while preserving Sprint 1 endpoint contracts.

## Authentication

The frontend initializes Firebase Auth from Vite environment variables. `VITE_MOCK_AUTH=true` enables deterministic local sign-in without Firebase credentials. Set `VITE_MOCK_AUTH=false` and provide Firebase web app variables for real Firebase Authentication.

## Firestore collections

The backend stabilizes the following collections:

- `users`
- `devices`
- `device_status`
- `alerts`
- `predictions`
- `telemetry_windows`
- `scenarios`
- `evaluation_runs`

## Backend Firebase configuration

The backend initializes Firebase Admin SDK when `MOCK_MODE=false` and credentials are provided through either:

- `FIREBASE_CREDENTIALS_PATH`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

If credentials are missing or initialization fails, the backend falls back to deterministic mock mode.

## Data contract stability

Existing API routes continue to return Sprint 1-compatible response shapes while using Firestore collection names internally, including `telemetry_windows` and `evaluation_runs`.
