from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.evaluation import Evaluation, EvaluationCreate
from app.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("", response_model=List[Evaluation])
async def get_evaluations():
    """Get all evaluations."""
    return evaluation_service.get_all()


@router.get("/summary")
async def get_evaluation_summary():
    return evaluation_service.get_evaluation_summary()


@router.get("/system-metrics")
async def get_system_metrics():
    return evaluation_service.get_system_metrics()


@router.get("/{evaluation_id}", response_model=Evaluation)
async def get_evaluation(evaluation_id: str):
    """Get a specific evaluation by ID."""
    evaluation = evaluation_service.get_by_id(evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation


@router.get("/model/{model_id}", response_model=List[Evaluation])
async def get_evaluations_by_model(model_id: str):
    """Get all evaluations for a specific model."""
    return evaluation_service.get_by_model(model_id)


@router.post("", response_model=Evaluation, status_code=201)
async def create_evaluation(evaluation: EvaluationCreate):
    """Create a new evaluation."""
    return evaluation_service.create(evaluation)
