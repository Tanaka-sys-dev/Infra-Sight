# Sprint 1 Notes

## Scope

Sprint 1 delivers a clean full-stack prototype with a FastAPI backend and Vite React frontend for ICT infrastructure monitoring and predictive maintenance.

## Assumptions

- Data is in-memory mock data for Sprint 1.
- External monitoring, CMDB, ML, or ticketing credentials are not required.
- The API is the authoritative source when running locally.
- The frontend gracefully falls back to mock data if the backend is unavailable.

## Mock mode

`MOCK_MODE=true` is configured in `infrasight-api/.env.example`. Mock mode enables deterministic local development and verification without external services.

## Environment strategy

- Backend virtual environment: `infrasight-api/.venv`
- Backend interpreter path: `infrasight-api/.venv/Scripts/python.exe`
- Frontend dependencies are installed only under `infrasight-web/node_modules`
