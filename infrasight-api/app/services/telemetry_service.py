from typing import List, Optional

from app.schemas.telemetry import Telemetry, TelemetryCreate
from app.services.firebase_service import datastore, timestamp_now


class TelemetryService:
    collection = "telemetry_windows"

    def get_all(self) -> List[Telemetry]:
        return [Telemetry(**self._normalize(record)) for record in datastore.list_documents(self.collection)]

    def get_by_id(self, telemetry_id: str) -> Optional[Telemetry]:
        record = datastore.get_document(self.collection, telemetry_id)
        return Telemetry(**self._normalize(record)) if record else None

    def get_by_device(self, device_id: str) -> List[Telemetry]:
        records = datastore.filter_documents(self.collection, "device_id", device_id)
        if not records:
            records = datastore.filter_documents(self.collection, "deviceId", device_id)
        return [Telemetry(**self._normalize(record)) for record in records]

    def create(self, telemetry_create: TelemetryCreate) -> Telemetry:
        document_id = datastore.next_id(self.collection, "tel")
        record = datastore.create_document(
            self.collection,
            document_id,
            {**telemetry_create.model_dump(), "timestamp": timestamp_now()},
        )
        return Telemetry(**record)

    def _normalize(self, record: dict) -> dict:
        normalized = dict(record)
        normalized["device_id"] = normalized.get("device_id") or normalized.get("deviceId") or "unknown"
        normalized["metric_name"] = normalized.get("metric_name") or normalized.get("metricName") or normalized.get("metric") or "health_score"
        normalized["metric_value"] = normalized.get("metric_value") or normalized.get("metricValue") or normalized.get("value") or normalized.get("healthScore") or normalized.get("cpuUsage") or 0.0
        normalized["unit"] = normalized.get("unit") or normalized.get("metricUnit") or "value"
        normalized["timestamp"] = normalized.get("timestamp") or normalized.get("window_end") or normalized.get("windowEnd") or normalized.get("createdAt") or timestamp_now()
        return normalized


telemetry_service = TelemetryService()
