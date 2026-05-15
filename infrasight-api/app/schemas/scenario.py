from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ScenarioBase(BaseModel):
    name: str
    description: str
    scenario_type: str


class Scenario(ScenarioBase):
    id: str
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioResult(BaseModel):
    scenario_id: str
    result: str
    metrics: dict
