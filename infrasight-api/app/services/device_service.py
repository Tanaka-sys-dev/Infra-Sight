from typing import List, Optional

from app.schemas.device import Device, DeviceCreate, DeviceUpdate
from app.services.firebase_service import datastore, timestamp_now


class DeviceService:
    collection = "devices"

    def get_all(self) -> List[Device]:
        return [Device(**self._normalize(record)) for record in datastore.list_documents(self.collection)]

    def get_by_id(self, device_id: str) -> Optional[Device]:
        record = datastore.get_document(self.collection, device_id)
        return Device(**self._normalize(record)) if record else None

    def create(self, device_create: DeviceCreate) -> Device:
        document_id = datastore.next_id(self.collection, "dev")
        record = datastore.create_document(
            self.collection,
            document_id,
            {**device_create.model_dump(), "last_seen": timestamp_now()},
        )
        return Device(**record)

    def update(self, device_id: str, device_update: DeviceUpdate) -> Optional[Device]:
        update_data = device_update.model_dump(exclude_unset=True)
        update_data["last_seen"] = timestamp_now()
        record = datastore.update_document(self.collection, device_id, update_data)
        return Device(**self._normalize(record)) if record else None

    def delete(self, device_id: str) -> bool:
        return datastore.delete_document(self.collection, device_id)

    def _normalize(self, record: dict) -> dict:
        normalized = dict(record)
        normalized["last_seen"] = normalized.get("last_seen") or normalized.get("lastSeen") or normalized.get("updatedAt") or timestamp_now()
        normalized["status"] = normalized.get("status") or normalized.get("healthState") or "unknown"
        normalized["type"] = normalized.get("type") or "unknown"
        normalized["name"] = normalized.get("name") or normalized.get("deviceId") or normalized.get("id")
        return normalized


device_service = DeviceService()
