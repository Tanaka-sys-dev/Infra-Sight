# InfraSight Deployment: Netlify (frontend) + Cloud Run (backend) + Firebase (Auth/Firestore)

This guide deploys the React (Vite) frontend to Netlify, the FastAPI backend to Google Cloud Run, and uses Firebase (Auth + Firestore) that you already configured in the project `infrasight-gzu`.

---

## 1) Backend: Deploy FastAPI to Cloud Run

Pre-reqs:
- gcloud CLI authenticated to the `infrasight-gzu` project
- Artifact Registry and Cloud Run APIs enabled

From the backend folder:

```bash
# In repo root
cd infrasight-api

# Build and deploy directly from source (Cloud Build)
gcloud run deploy infrasight-api \
  --source . \
  --project infrasight-gzu \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars MOCK_MODE=false \
  --set-env-vars ENABLE_BACKGROUND_POLLING=0 \
  --set-env-vars ALLOWED_ORIGINS=http://localhost:5173,https://YOUR-SITE-NAME.netlify.app
```

Notes:
- Background telemetry thread is disabled in serverless via `ENABLE_BACKGROUND_POLLING=0`. Use Cloud Scheduler to trigger polling.
- CORS origins can be edited via `ALLOWED_ORIGINS` (comma-separated).
- Firebase Admin credentials: The app requires a service account credential (file path or individual key fields). Recommended options:
  - Secret Manager (env fields): create secrets for `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, etc., and set them as environment variables on the Cloud Run service.
  - Secret Manager (file): mount the JSON service account as a file and set `GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/firebase.json` or `FIREBASE_SERVICE_ACCOUNT_PATH=/var/secrets/firebase.json`.
  - Ensure `MOCK_MODE=false` so Firestore is used instead of mock data.

---

## 2) Cloud Scheduler: Trigger telemetry polling

Create a scheduler job to call the API periodically (e.g., every 1 minute):

```bash
gcloud scheduler jobs create http infrasight-telemetry-poll \
  --project infrasight-gzu \
  --location us-central1 \
  --schedule "*/1 * * * *" \
  --uri "https://YOUR-CLOUD-RUN-URL/api/telemetry/poll" \
  --http-method POST \
  --oidc-service-account-email YOUR-CLOUD-RUN-SA@infrasight-gzu.iam.gserviceaccount.com
```

Replace `YOUR-CLOUD-RUN-URL` (from Step 1 output) and the service account email accordingly.

---

## 3) Frontend: Netlify configuration

At the repo root we added `netlify.toml` for a monorepo setup (frontend in `infrasight-web`).

- Connect your GitHub repo to Netlify
- Set the following Environment Variables in your Netlify site settings:
  - `VITE_API_URL` = `https://YOUR-CLOUD-RUN-URL`
  - Optional: `VITE_MOCK_AUTH` = `true` or `false` depending on your setup
- Build settings (from netlify.toml):
  - Base directory: `infrasight-web`
  - Build command: `npm run build`
  - Publish directory: `dist`

> SPA routing and an example API proxy rule are included in `netlify.toml`.

---

## 4) Firebase Auth domains

Add your Netlify production domain (and preview domains if desired) to
Firebase Console → Authentication → Settings → Authorized domains.

---

## 5) Verify

- Open the Netlify site → Log in via Firebase → Navigate to Dashboard and Infrastructure pages
- Confirm API calls are going to your Cloud Run URL (Network tab)
- Trigger a manual telemetry poll via `/api/telemetry/poll` (should refresh data)

---

## 6) Troubleshooting

- CORS: Update `ALLOWED_ORIGINS` on Cloud Run to include your Netlify domain
- 401/403 from Firebase: Verify service account permissions and Auth domain setup
- Background work: Ensure Cloud Scheduler job is active and has permissions to call Cloud Run

