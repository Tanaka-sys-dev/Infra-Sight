from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EvaluationBase(BaseModel):
    model_id: str
    metric_name: str
    metric_value: float


class Evaluation(EvaluationBase):
    id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class EvaluationCreate(EvaluationBase):
    pass
