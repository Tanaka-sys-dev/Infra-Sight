from fastapi import APIRouter, HTTPException, Query
from typing import List
from pydantic import BaseModel
from app.schemas.alert import Alert, AlertCreate, AlertUpdate
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertActionRequest(BaseModel):
    userId: str = "system"
    resolutionNote: str = ""


@router.get("")
async def get_alerts(
    status: str | None = None,
    severity: str | None = None,
    deviceId: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
):
    """Get all alerts."""
    return alert_service.query(status=status, severity=severity, device_id=deviceId, limit=limit)


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, payload: AlertActionRequest = AlertActionRequest()):
    alert = alert_service.acknowledge(alert_id, payload.userId)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, payload: AlertActionRequest = AlertActionRequest()):
    alert = alert_service.resolve(alert_id, payload.userId, payload.resolutionNote)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.get("/device/{device_id}", response_model=List[Alert])
async def get_alerts_by_device(device_id: str):
    """Get all alerts for a specific device."""
    return alert_service.get_by_device(device_id)


@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    """Get a specific alert by ID."""
    alert = alert_service.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("", response_model=Alert, status_code=201)
async def create_alert(alert: AlertCreate):
    """Create a new alert."""
    return alert_service.create(alert)


@router.put("/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, alert_update: AlertUpdate):
    """Update an alert."""
    alert = alert_service.update(alert_id, alert_update)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: str):
    """Delete an alert."""
    success = alert_service.delete(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
