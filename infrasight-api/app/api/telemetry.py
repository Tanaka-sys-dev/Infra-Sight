from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.jobs.shared import polling_job
from app.schemas.telemetry import Telemetry, TelemetryCreate
from app.services.firebase_service import datastore
from app.services.telemetry_service import telemetry_service

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class TelemetryIngestRequest(BaseModel):
    deviceId: str
    deviceType: str
    metrics: Dict[str, float]
    scenarioMode: str = "normal"
    source: str = "external"


class TelemetrySimulateRequest(BaseModel):
    deviceId: str
    deviceType: str
    scenarioMode: str = "normal"
    count: int = Field(default=1, ge=1, le=50)


@router.post("/ingest")
async def ingest_telemetry(payload: TelemetryIngestRequest):
    reading = {
        "deviceId": payload.deviceId,
        "deviceType": payload.deviceType,
        "scenarioMode": payload.scenarioMode,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "isAnomaly": _is_payload_anomaly(payload.metrics),
        "metrics": {key: round(float(value), 2) for key, value in payload.metrics.items()},
        "source": payload.source,
    }
    result = polling_job.ingest_reading(payload.deviceId, payload.deviceType, reading)
    return {
        "ingested": True,
        "deviceId": payload.deviceId,
        "healthState": result["healthState"],
        "windowBuilt": result["window"] is not None,
        "window": result["window"],
    }


@router.post("/simulate")
async def simulate_telemetry(payload: TelemetrySimulateRequest):
    readings = []
    latest_result = None
    built_window = None
    for _ in range(payload.count):
        reading = polling_job.simulator.generate_reading(payload.deviceId, payload.deviceType, payload.scenarioMode)
        latest_result = polling_job.ingest_reading(payload.deviceId, payload.deviceType, reading)
        readings.append(reading)
        if latest_result["window"] is not None:
            built_window = latest_result["window"]
    return {
        "deviceId": payload.deviceId,
        "scenarioMode": payload.scenarioMode,
        "readingsGenerated": len(readings),
        "readings": readings,
        "windowBuilt": built_window is not None,
        "window": built_window,
        "healthState": latest_result["healthState"] if latest_result else "unknown",
    }


@router.post("/poll")
async def poll_telemetry():
    devices = datastore.list_documents("devices")
    results = polling_job.poll_all_devices(devices)
    return {
        "polled": len(results),
        "results": results,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/stream/{device_id}")
async def get_telemetry_stream(device_id: str, limit: int = Query(default=20, ge=1, le=100)):
    buffered = list(polling_job.readings_buffer.get(device_id, []))
    readings = buffered[-limit:]
    if not readings:
        windows = [window for window in datastore.list_documents("telemetry_windows") if window.get("deviceId") == device_id or window.get("device_id") == device_id]
        windows = sorted(windows, key=lambda item: str(item.get("windowEnd") or item.get("timestamp") or ""))
        for window in windows[-limit:]:
            if isinstance(window.get("readings"), list):
                readings.extend(window["readings"])
        readings = readings[-limit:]
    readings = sorted(readings, key=lambda item: item.get("timestamp", ""))
    return {"deviceId": device_id, "readings": readings, "count": len(readings)}


@router.get("", response_model=List[Telemetry])
async def get_telemetry():
    return telemetry_service.get_all()


@router.get("/device/{device_id}", response_model=List[Telemetry])
async def get_telemetry_by_device(device_id: str):
    return telemetry_service.get_by_device(device_id)


@router.get("/{telemetry_id}", response_model=Telemetry)
async def get_telemetry_record(telemetry_id: str):
    telemetry = telemetry_service.get_by_id(telemetry_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return telemetry


@router.post("", response_model=Telemetry, status_code=201)
async def create_telemetry(telemetry: TelemetryCreate):
    return telemetry_service.create(telemetry)


def _is_payload_anomaly(metrics: Dict[str, float]) -> bool:
    return (
        metrics.get("cpuUsage", 0) > 70
        or metrics.get("memoryUsage", 0) > 78
        or metrics.get("packetLoss", 0) > 4
        or metrics.get("interfaceErrorCount", 0) > 8
        or metrics.get("restartFrequency", 0) > 1
        or metrics.get("uptimePattern", 100) < 92
    )
