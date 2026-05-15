from datetime import datetime, timezone

from app.simulation.simulator import TelemetrySimulator


class StatusUpdater:
    def __init__(self):
        self.simulator = TelemetrySimulator()

    def update_device_status(self, device_id, device_type, latest_reading, prediction=None, datastore=None):
        metrics = latest_reading.get("metrics", {})
        status_document = {
            "id": device_id,
            "deviceId": device_id,
            "healthState": self.simulator.get_device_health_state(metrics, device_type),
            "predictionState": prediction.get("predictionState", prediction.get("label", "normal")) if prediction else "normal",
            "confidence": float(prediction.get("confidence", 0.0)) if prediction else 0.0,
            "activeAlertCount": 0,
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "currentTelemetry": metrics,
        }
        if datastore is not None:
            existing = datastore.get_document("device_status", device_id)
            if existing:
                datastore.update_document("device_status", device_id, status_document)
            else:
                datastore.create_document("device_status", device_id, status_document)
        return status_document
