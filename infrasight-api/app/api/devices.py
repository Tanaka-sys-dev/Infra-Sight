from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.device import Device, DeviceCreate, DeviceUpdate
from app.services.device_service import device_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=List[Device])
async def get_devices():
    """Get all devices."""
    return device_service.get_all()


@router.get("/{device_id}", response_model=Device)
async def get_device(device_id: str):
    """Get a specific device by ID."""
    device = device_service.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("", response_model=Device, status_code=201)
async def create_device(device: DeviceCreate):
    """Create a new device."""
    return device_service.create(device)


@router.put("/{device_id}", response_model=Device)
async def update_device(device_id: str, device_update: DeviceUpdate):
    """Update a device."""
    device = device_service.update(device_id, device_update)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.delete("/{device_id}", status_code=204)
async def delete_device(device_id: str):
    """Delete a device."""
    success = device_service.delete(device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
