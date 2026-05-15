import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, devices, evaluation, firebase, predictions, scenarios, telemetry
from app.core.config import settings
from app.jobs.shared import polling_job
from app.services.firebase_service import datastore

logger = logging.getLogger("infrasight.polling")
_polling_stop_event = threading.Event()
_polling_thread = None


def _polling_loop():
    while not _polling_stop_event.is_set():
        try:
            logger.info("Background telemetry poll cycle starting")
            devices_list = datastore.list_documents("devices")
            results = polling_job.poll_all_devices(devices_list)
            logger.info("Background telemetry poll cycle completed for %s devices", len(results))
        except Exception:
            logger.exception("Background telemetry poll cycle failed")
        _polling_stop_event.wait(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_thread
    _polling_stop_event.clear()
    _polling_thread = threading.Thread(target=_polling_loop, daemon=True, name="infrasight-telemetry-poller")
    _polling_thread.start()
    logger.info("Background telemetry polling started")
    try:
        yield
    finally:
        _polling_stop_event.set()
        if _polling_thread and _polling_thread.is_alive():
            _polling_thread.join(timeout=5)
        logger.info("Background telemetry polling stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(scenarios.router, prefix=settings.API_V1_PREFIX)
app.include_router(evaluation.router, prefix=settings.API_V1_PREFIX)
app.include_router(telemetry.router, prefix=settings.API_V1_PREFIX)
app.include_router(firebase.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "message": "InfraSight API",
        "version": settings.APP_VERSION,
        "status": "operational",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "mock_mode": settings.MOCK_MODE,
        "firebase_enabled": not settings.MOCK_MODE,
    }
