from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TelemetryBase(BaseModel):
    device_id: str
    metric_name: str
    metric_value: float
    unit: str


class Telemetry(TelemetryBase):
    id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class TelemetryCreate(TelemetryBase):
    pass
