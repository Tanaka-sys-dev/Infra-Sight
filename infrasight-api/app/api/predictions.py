from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.firebase_service import datastore
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/predictions", tags=["predictions"])


class PredictRequest(BaseModel):
    deviceId: str
    deviceType: str
    features: dict


class PredictWindowRequest(BaseModel):
    deviceId: str
    features: dict
    windowId: str | None = None


@router.get("")
async def get_predictions(limit: int = Query(default=50, ge=1, le=200)):
    return prediction_service.get_all_predictions(datastore, limit=limit)


@router.get("/model/info")
async def get_model_info():
    return prediction_service.model_manager.get_model_info()


@router.post("/model/train")
async def train_model():
    metrics = prediction_service.model_manager.train_and_save(n_samples=500, use_firestore=True, datastore=datastore)
    return {"trained": True, "metrics": metrics, "modelInfo": prediction_service.model_manager.get_model_info()}


@router.post("/predict")
async def predict_device(payload: PredictRequest):
    prediction = prediction_service.predict_for_device(payload.deviceId, payload.features, datastore=datastore)
    prediction_service.create_predictive_alert(payload.deviceId, prediction, datastore, threshold=0.75)
    return prediction


@router.post("/predict-window")
async def predict_window(payload: PredictWindowRequest):
    window = {"deviceId": payload.deviceId, "features": payload.features, "windowId": payload.windowId}
    return prediction_service.predict_from_window(window, datastore=datastore)


@router.get("/{device_id}")
async def get_latest_prediction(device_id: str):
    prediction = prediction_service.get_latest_prediction(device_id, datastore)
    return prediction or {"deviceId": device_id, "predictedClass": "normal", "confidence": 0, "topFeatures": [], "modelVersion": "rf-v1"}
