from typing import List, Optional

from app.ml.model_manager import MODEL_PATH, ModelManager
from app.schemas.evaluation import Evaluation, EvaluationCreate
from app.services.firebase_service import datastore, timestamp_now


class EvaluationService:
    collection = "evaluation_runs"

    def get_all(self) -> List[Evaluation]:
        return [Evaluation(**self._normalize(record)) for record in datastore.list_documents(self.collection)]

    def get_by_id(self, evaluation_id: str) -> Optional[Evaluation]:
        record = datastore.get_document(self.collection, evaluation_id)
        return Evaluation(**self._normalize(record)) if record else None

    def get_by_model(self, model_id: str) -> List[Evaluation]:
        records = datastore.filter_documents(self.collection, "model_id", model_id)
        if not records:
            records = datastore.filter_documents(self.collection, "modelId", model_id)
        return [Evaluation(**self._normalize(record)) for record in records]

    def create(self, evaluation_create: EvaluationCreate) -> Evaluation:
        document_id = datastore.next_id(self.collection, "eval")
        record = datastore.create_document(
            self.collection,
            document_id,
            {**evaluation_create.model_dump(), "timestamp": timestamp_now()},
        )
        return Evaluation(**record)

    def get_evaluation_summary(self) -> dict:
        model_manager = ModelManager()
        model_manager.load_model()
        info = model_manager.get_model_info()
        metrics = info.get("metrics", {})
        return {
            "modelMetrics": {
                "accuracy": metrics.get("accuracy", 0),
                "precision": metrics.get("precision", 0),
                "recall": metrics.get("recall", 0),
                "f1Score": metrics.get("f1_score", 0),
                "modelVersion": info.get("model_version", "rf-v1"),
                "lastTrained": timestamp_now() if not MODEL_PATH.exists() else timestamp_now_from_path(MODEL_PATH),
            },
            "featureImportance": info.get("feature_importance", []),
            "systemMetrics": self.get_system_metrics(),
        }

    def get_system_metrics(self) -> dict:
        predictions = datastore.list_documents("predictions")
        alerts = datastore.list_documents("alerts")
        return {
            "totalPredictions": len(predictions),
            "faultPronePredictions": len([item for item in predictions if item.get("predictedClass") == "fault_prone" or item.get("prediction_type") == "fault_prone"]),
            "normalPredictions": len([item for item in predictions if item.get("predictedClass") == "normal" or item.get("prediction_type") == "normal"]),
            "activeAlerts": len([item for item in alerts if item.get("status") == "active" or item.get("resolved") is False]),
            "devicesMonitored": len(datastore.list_documents("devices")),
            "windowsBuilt": len(datastore.list_documents("telemetry_windows")),
        }

    def _normalize(self, record: dict) -> dict:
        normalized = dict(record)
        normalized["model_id"] = normalized.get("model_id") or normalized.get("modelId") or normalized.get("model") or normalized.get("modelVersion") or "unknown"
        normalized["metric_name"] = normalized.get("metric_name") or normalized.get("metricName") or normalized.get("metric") or "f1_score"
        normalized["metric_value"] = normalized.get("metric_value") or normalized.get("metricValue") or normalized.get("value") or normalized.get("score") or normalized.get("f1Score") or 0.0
        normalized["timestamp"] = normalized.get("timestamp") or normalized.get("createdAt") or normalized.get("created_at") or normalized.get("evaluationDate") or timestamp_now()
        return normalized


evaluation_service = EvaluationService()


def timestamp_now_from_path(path):
    from datetime import datetime, timezone

    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
