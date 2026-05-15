# InfraSight

InfraSight is a full-stack ICT infrastructure monitoring and predictive maintenance prototype for Great Zimbabwe University. It combines a FastAPI backend, Vite React frontend, Firebase Authentication, Firestore persistence, telemetry simulation, observation windows, Random Forest prediction, alert management, scenario validation, and dissertation evaluation dashboards.

## Sprint Summary

- Sprint 1: Project foundation with FastAPI, Vite React, core API routes, and verification automation.
- Sprint 2: Firebase Authentication and Firestore integration with secure service-account path handling.
- Sprint 3: Telemetry simulator, polling pipeline, observation windows, status updates, and device detail visualisation.
- Sprint 4: Random Forest prediction engine, model training, prediction APIs, automatic predictive alerts, scenario prediction, and model evaluation metrics.
- Sprint 5: Evaluation dashboard, alert acknowledgement/resolution, scenario validation history, settings page, dashboard presentation polish, and dissertation demo documentation.

## Project Structure

```text
D:\PRJ
├── docs/
├── infrasight-api/
│   ├── app/api/
│   ├── app/jobs/
│   ├── app/ml/
│   ├── app/services/
│   └── app/simulation/
├── infrasight-web/
│   └── src/
├── verify-all.ps1
└── README.md
```

## Backend Setup

```powershell
.\infrasight-api\.venv\Scripts\python.exe -m pip install -r .\infrasight-api\requirements.txt
.\infrasight-api\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Run backend commands from `D:\PRJ\infrasight-api` or set `PYTHONPATH` to that directory.

## Frontend Setup

```powershell
npm install --prefix .\infrasight-web
npm run build --prefix .\infrasight-web
npm run dev --prefix .\infrasight-web
```

## Firebase

The verified live project is `infrasight-gzu`. Service account JSON files and `.env` files must remain outside source control. The backend supports Firestore live mode and deterministic mock fallback.

## Main Demo Flow

1. Login with the configured GZU admin user.
2. Open Dashboard for the system overview.
3. Review devices, recent alerts, predictions, and the system health chart.
4. Open Devices and inspect a device detail page.
5. Run simulation and Predict Now.
6. Open Predictions to show model performance and feature importance.
7. Open Alerts to acknowledge and resolve generated alerts.
8. Open Scenarios to run validation scenarios and review pass/fail history.
9. Open Evaluation to show dissertation KPI improvements and export JSON evidence.
10. Open Settings to review thresholds, model settings, and Firebase status.

## Important Endpoints

- `GET /health`
- `GET /api/devices`
- `GET /api/alerts`
- `POST /api/alerts/{alert_id}/acknowledge`
- `POST /api/alerts/{alert_id}/resolve`
- `GET /api/predictions/model/info`
- `POST /api/predictions/predict`
- `GET /api/evaluation/summary`
- `GET /api/evaluation/system-metrics`
- `POST /api/scenarios/run-and-predict`
- `GET /api/scenarios/runs`
- `POST /api/telemetry/poll`
- `GET /api/firebase/status`

## Verification

```powershell
.\verify-all.ps1
```

The verifier checks project structure, Firebase modules, secret ignore patterns, frontend build, backend imports, backend startup, and required API endpoints.

## Secret Safety

Do not commit `.env`, service account JSON, private keys, virtual environments, node modules, build output, or generated model artifacts.
