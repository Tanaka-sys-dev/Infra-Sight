from datetime import datetime, timezone
from uuid import uuid4

from app.simulation.simulator import TelemetrySimulator


class WindowBuilder:
    DEFAULT_WINDOW_SIZE = 10
    FAULT_THRESHOLDS = {
        "cpuUsage_mean": 75,
        "memoryUsage_mean": 78,
        "packetLoss_mean": 5,
        "interfaceErrorCount_mean": 8,
        "restartFrequency_total": 2,
        "latency_mean": 60,
        "uptimePattern_mean": 90,
    }

    def build_window(self, readings, device_id, device_type, source="simulator"):
        if len(readings) < 2:
            return None
        timestamps = [reading["timestamp"] for reading in readings]
        feature_stats = {}
        features = {}
        for metric in TelemetrySimulator.METRICS:
            values = [float(reading["metrics"].get(metric, 0.0)) for reading in readings]
            mean_value = round(sum(values) / len(values), 2)
            features[metric] = mean_value
            feature_stats[metric] = {
                "mean": mean_value,
                "max": round(max(values), 2),
                "min": round(min(values), 2),
            }
        return {
            "windowId": str(uuid4()),
            "id": str(uuid4()),
            "deviceId": device_id,
            "deviceType": device_type,
            "windowSize": len(readings),
            "windowStart": min(timestamps),
            "windowEnd": max(timestamps),
            "source": source,
            "label": self.apply_fault_thresholds(features),
            "features": features,
            "featureStats": feature_stats,
            "readings": readings,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

    def apply_fault_thresholds(self, features):
        if features.get("cpuUsage", 0) > self.FAULT_THRESHOLDS["cpuUsage_mean"]:
            return "fault_prone"
        if features.get("memoryUsage", 0) > self.FAULT_THRESHOLDS["memoryUsage_mean"]:
            return "fault_prone"
        if features.get("packetLoss", 0) > self.FAULT_THRESHOLDS["packetLoss_mean"]:
            return "fault_prone"
        if features.get("interfaceErrorCount", 0) > self.FAULT_THRESHOLDS["interfaceErrorCount_mean"]:
            return "fault_prone"
        if features.get("restartFrequency", 0) > self.FAULT_THRESHOLDS["restartFrequency_total"]:
            return "fault_prone"
        if features.get("latency", 0) > self.FAULT_THRESHOLDS["latency_mean"]:
            return "fault_prone"
        if features.get("uptimePattern", 100) < self.FAULT_THRESHOLDS["uptimePattern_mean"]:
            return "fault_prone"
        return "normal"
