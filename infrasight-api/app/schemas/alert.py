from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertBase(BaseModel):
    device_id: str
    severity: str
    message: str
    alert_type: str


class Alert(AlertBase):
    id: str
    timestamp: datetime
    resolved: bool = False
    
    class Config:
        from_attributes = True


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    resolved: Optional[bool] = None
