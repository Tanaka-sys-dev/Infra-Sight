from typing import List, Optional

from app.schemas.alert import Alert, AlertCreate, AlertUpdate
from app.services.firebase_service import datastore, timestamp_now


class AlertService:
    collection = "alerts"

    def get_all(self) -> List[Alert]:
        return [Alert(**self._normalize(record)) for record in datastore.list_documents(self.collection)]

    def query(self, status: Optional[str] = None, severity: Optional[str] = None, device_id: Optional[str] = None, limit: int = 100) -> List[dict]:
        records = [self._normalize(record) for record in datastore.list_documents(self.collection)]
        if status:
            status_lower = status.lower()
            records = [record for record in records if record.get("status", "active").lower() == status_lower or ("resolved" == status_lower and record.get("resolved"))]
        if severity:
            records = [record for record in records if record.get("severity", "").lower() == severity.lower()]
        if device_id:
            records = [record for record in records if record.get("device_id") == device_id or record.get("deviceId") == device_id]
        records = sorted(records, key=lambda record: str(record.get("timestamp") or record.get("createdAt") or ""), reverse=True)
        return records[:limit]

    def get_by_id(self, alert_id: str) -> Optional[Alert]:
        record = datastore.get_document(self.collection, alert_id)
        return Alert(**self._normalize(record)) if record else None

    def get_by_device(self, device_id: str) -> List[Alert]:
        records = datastore.filter_documents(self.collection, "device_id", device_id)
        if not records:
            records = datastore.filter_documents(self.collection, "deviceId", device_id)
        return [Alert(**self._normalize(record)) for record in records]

    def create(self, alert_create: AlertCreate) -> Alert:
        document_id = datastore.next_id(self.collection, "alert")
        record = datastore.create_document(
            self.collection,
            document_id,
            {**alert_create.model_dump(), "timestamp": timestamp_now(), "resolved": False},
        )
        return Alert(**record)

    def update(self, alert_id: str, alert_update: AlertUpdate) -> Optional[Alert]:
        record = datastore.update_document(self.collection, alert_id, alert_update.model_dump(exclude_unset=True))
        return Alert(**self._normalize(record)) if record else None

    def acknowledge(self, alert_id: str, user_id: str = "system") -> Optional[dict]:
        return datastore.update_document(self.collection, alert_id, {
            "status": "acknowledged",
            "acknowledgedBy": user_id or "system",
            "acknowledgedAt": timestamp_now(),
            "resolved": False,
        })

    def resolve(self, alert_id: str, user_id: str = "system", resolution_note: str = "") -> Optional[dict]:
        return datastore.update_document(self.collection, alert_id, {
            "status": "resolved",
            "resolved": True,
            "resolvedBy": user_id or "system",
            "resolvedAt": timestamp_now(),
            "resolutionNote": resolution_note,
        })

    def delete(self, alert_id: str) -> bool:
        return datastore.delete_document(self.collection, alert_id)

    def _normalize(self, record: dict) -> dict:
        normalized = dict(record)
        normalized["device_id"] = normalized.get("device_id") or normalized.get("deviceId") or "unknown"
        normalized["alert_type"] = normalized.get("alert_type") or normalized.get("type") or normalized.get("category") or "general"
        normalized["timestamp"] = normalized.get("timestamp") or normalized.get("createdAt") or normalized.get("created_at") or timestamp_now()
        normalized["severity"] = normalized.get("severity") or "info"
        normalized["message"] = normalized.get("message") or normalized.get("title") or "Alert"
        normalized["resolved"] = normalized.get("resolved", False)
        normalized["status"] = normalized.get("status") or ("resolved" if normalized["resolved"] else "active")
        return normalized


alert_service = AlertService()
