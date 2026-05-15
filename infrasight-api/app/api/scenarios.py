from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from app.schemas.scenario import Scenario, ScenarioCreate, ScenarioResult
from app.services.scenario_service import scenario_service

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


class RunAndPredictRequest(BaseModel):
    scenarioId: str
    deviceId: str
    deviceType: str
    durationSeconds: int = 30


@router.get("", response_model=List[Scenario])
async def get_scenarios():
    """Get all scenarios."""
    return scenario_service.get_all()


@router.post("/run-and-predict")
async def run_and_predict(payload: RunAndPredictRequest):
    return scenario_service.run_and_predict(
        payload.scenarioId,
        payload.deviceId,
        payload.deviceType,
        payload.durationSeconds,
    )


@router.get("/runs")
async def get_scenario_runs(limit: int = 100):
    return scenario_service.get_runs(limit=limit)


@router.get("/{scenario_id}", response_model=Scenario)
async def get_scenario(scenario_id: str):
    """Get a specific scenario by ID."""
    scenario = scenario_service.get_by_id(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("", response_model=Scenario, status_code=201)
async def create_scenario(scenario: ScenarioCreate):
    """Create a new scenario."""
    return scenario_service.create(scenario)


@router.post("/{scenario_id}/run", response_model=ScenarioResult)
async def run_scenario(scenario_id: str):
    """Run a scenario simulation."""
    return scenario_service.run_scenario(scenario_id)
