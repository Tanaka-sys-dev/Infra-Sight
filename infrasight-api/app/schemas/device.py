from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DeviceBase(BaseModel):
    name: str
    type: str
    status: str
    location: Optional[str] = None


class Device(DeviceBase):
    id: str
    last_seen: datetime
    
    class Config:
        from_attributes = True


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
