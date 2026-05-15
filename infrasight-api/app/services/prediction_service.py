from datetime import datetime, timezone
from uuid import uuid4

from app.ml.model_manager import ModelManager
from app.services.firebase_service import datastore


class PredictionService:
    collection = "predictions"

    def __init__(self):
        self.model_manager = ModelManager()
        if not self.model_manager.load_model():
            self.model_manager.train_and_save(n_samples=500)

    def predict_for_device(self, device_id, features_dict, datastore=None):
        store = datastore
        result = self.model_manager.predict(features_dict)
        top_features = []
        for item in self.model_manager.trainer.feature_importance[:3]:
            name = item["feature"]
            top_features.append({"name": name, "value": float(features_dict.get(name, 0)), "importance": item["importance"]})
        prediction_id = str(uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        document = {
            "id": prediction_id,
            "predictionId": prediction_id,
            "deviceId": device_id,
            "device_id": device_id,
            "predictedClass": result["predictedClass"],
            "prediction_type": result["predictedClass"],
            "confidence": result["confidence"],
            "probability": result["confidence"],
            "allProbabilities": result["allProbabilities"],
            "topFeatures": top_features,
            "modelVersion": "rf-v1",
            "createdAt": created_at,
            "timestamp": created_at,
        }
        if store is not None:
            store.create_document(self.collection, prediction_id, document)
        return document

    def predict_from_window(self, window_dict, datastore=None):
        features = window_dict.get("features", {})
        prediction = self.predict_for_device(window_dict.get("deviceId") or window_dict.get("device_id"), features, datastore=datastore)
        prediction["windowId"] = window_dict.get("windowId") or window_dict.get("id")
        if datastore is not None:
            datastore.update_document(self.collection, prediction["predictionId"], {"windowId": prediction["windowId"]})
        return prediction

    def create_predictive_alert(self, device_id, prediction, datastore, threshold=0.7):
        if prediction.get("predictedClass") != "fault_prone" or float(prediction.get("confidence", 0)) <= threshold:
            return None
        alert_id = str(uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        alert = {
            "id": alert_id,
            "deviceId": device_id,
            "device_id": device_id,
            "type": "predictive",
            "severity": "critical" if float(prediction.get("confidence", 0)) > 0.85 else "warning",
            "message": f"Random Forest predicts {device_id} is fault-prone with {float(prediction.get('confidence', 0)) * 100:.0f}% confidence.",
            "status": "active",
            "resolved": False,
            "predictionId": prediction.get("predictionId"),
            "createdAt": created_at,
            "timestamp": created_at,
        }
        datastore.create_document("alerts", alert_id, alert)
        return alert

    def get_latest_prediction(self, device_id, datastore):
        records = [record for record in datastore.list_documents(self.collection) if record.get("deviceId") == device_id or record.get("device_id") == device_id]
        if not records:
            return None
        return sorted(records, key=lambda record: str(record.get("createdAt") or record.get("timestamp") or ""), reverse=True)[0]

    def get_all_predictions(self, datastore, limit=50):
        records = datastore.list_documents(self.collection)
        records = sorted(records, key=lambda record: str(record.get("createdAt") or record.get("timestamp") or ""), reverse=True)
        return records[:limit]

    def get_all(self):
        return self.get_all_predictions(datastore)

    def get_by_id(self, prediction_id):
        return datastore.get_document(self.collection, prediction_id)

    def get_by_device(self, device_id):
        latest = self.get_latest_prediction(device_id, datastore)
        return [latest] if latest else []


prediction_service = PredictionService()
