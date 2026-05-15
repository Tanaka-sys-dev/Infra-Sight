from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PredictionBase(BaseModel):
    device_id: str
    prediction_type: str
    probability: float
    time_to_failure: Optional[int] = None


class Prediction(PredictionBase):
    id: str
    timestamp: datetime
    confidence: float
    
    class Config:
        from_attributes = True


class PredictionCreate(PredictionBase):
    pass
