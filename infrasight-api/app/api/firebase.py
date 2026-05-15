from fastapi import APIRouter, HTTPException

from app.services.firebase_service import datastore
from app.services.mock_data import SEED_DATA

router = APIRouter(prefix="/firebase", tags=["firebase"])
ALLOWED_COLLECTIONS = set(SEED_DATA.keys())


@router.get("/status")
async def firebase_status():
    return {
        "datastore_mode": datastore.mode,
        "project_id": "infrasight-gzu",
        "collections": list(SEED_DATA.keys()),
        "message": datastore.error,
    }


@router.get("/collections/{collection_name}")
async def read_collection(collection_name: str):
    if collection_name not in ALLOWED_COLLECTIONS:
        raise HTTPException(status_code=404, detail="Collection is not part of the InfraSight data contract")
    return datastore.list_documents(collection_name)


@router.post("/seed")
async def seed_firestore():
    datastore.seed_collections()
    return {
        "status": "seeded",
        "datastore_mode": datastore.mode,
        "collections": list(SEED_DATA.keys()),
    }
