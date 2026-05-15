import random
from datetime import datetime, timezone
from copy import deepcopy


class TelemetrySimulator:
    NORMAL = "normal"
    HIGH_CPU = "high_cpu_overload"
    PACKET_LOSS = "packet_loss_surge"
    RESTART = "restart_instability"
    HIGH_LATENCY = "high_latency"
    MEMORY_PRESSURE = "memory_pressure"
    RECOVERY = "recovery"

    METRICS = [
        "cpuUsage",
        "memoryUsage",
        "diskUtilisation",
        "packetLoss",
        "latency",
        "interfaceErrorCount",
        "restartFrequency",
        "uptimePattern",
    ]

    DEVICE_PROFILES = {
        "server": {
            "cpuUsage": {"min": 5, "max": 95, "normal_max": 65},
            "memoryUsage": {"min": 20, "max": 92, "normal_max": 70},
            "diskUtilisation": {"min": 30, "max": 88, "normal_max": 65},
            "packetLoss": {"min": 0, "max": 8, "normal_max": 2},
            "latency": {"min": 2, "max": 120, "normal_max": 25},
            "interfaceErrorCount": {"min": 0, "max": 25, "normal_max": 3},
            "restartFrequency": {"min": 0, "max": 5, "normal_max": 0},
            "uptimePattern": {"min": 85, "max": 100, "normal_max": 100, "normal_min": 95},
        },
        "switch": {
            "cpuUsage": {"min": 5, "max": 85, "normal_max": 45},
            "memoryUsage": {"min": 10, "max": 80, "normal_max": 55},
            "diskUtilisation": {"min": 5, "max": 60, "normal_max": 40},
            "packetLoss": {"min": 0, "max": 15, "normal_max": 3},
            "latency": {"min": 1, "max": 80, "normal_max": 15},
            "interfaceErrorCount": {"min": 0, "max": 50, "normal_max": 5},
            "restartFrequency": {"min": 0, "max": 4, "normal_max": 0},
            "uptimePattern": {"min": 80, "max": 100, "normal_max": 100, "normal_min": 95},
        },
        "router": {
            "cpuUsage": {"min": 5, "max": 90, "normal_max": 55},
            "memoryUsage": {"min": 15, "max": 85, "normal_max": 60},
            "diskUtilisation": {"min": 5, "max": 55, "normal_max": 35},
            "packetLoss": {"min": 0, "max": 12, "normal_max": 2},
            "latency": {"min": 1, "max": 100, "normal_max": 20},
            "interfaceErrorCount": {"min": 0, "max": 35, "normal_max": 4},
            "restartFrequency": {"min": 0, "max": 4, "normal_max": 0},
            "uptimePattern": {"min": 82, "max": 100, "normal_max": 100, "normal_min": 95},
        },
        "access_point": {
            "cpuUsage": {"min": 5, "max": 80, "normal_max": 45},
            "memoryUsage": {"min": 10, "max": 75, "normal_max": 50},
            "diskUtilisation": {"min": 5, "max": 50, "normal_max": 30},
            "packetLoss": {"min": 0, "max": 20, "normal_max": 4},
            "latency": {"min": 3, "max": 150, "normal_max": 30},
            "interfaceErrorCount": {"min": 0, "max": 40, "normal_max": 6},
            "restartFrequency": {"min": 0, "max": 6, "normal_max": 0},
            "uptimePattern": {"min": 75, "max": 100, "normal_max": 100, "normal_min": 90},
        },
        "workstation": {
            "cpuUsage": {"min": 2, "max": 98, "normal_max": 70},
            "memoryUsage": {"min": 15, "max": 95, "normal_max": 75},
            "diskUtilisation": {"min": 20, "max": 90, "normal_max": 70},
            "packetLoss": {"min": 0, "max": 10, "normal_max": 2},
            "latency": {"min": 3, "max": 60, "normal_max": 20},
            "interfaceErrorCount": {"min": 0, "max": 15, "normal_max": 2},
            "restartFrequency": {"min": 0, "max": 8, "normal_max": 1},
            "uptimePattern": {"min": 70, "max": 100, "normal_max": 100, "normal_min": 85},
        },
    }

    def __init__(self):
        self._recovery_state = {}

    def generate_reading(self, device_id, device_type, scenario_mode="normal"):
        profile = self.DEVICE_PROFILES.get(device_type, self.DEVICE_PROFILES["server"])
        metrics = self._normal_metrics(profile)
        metrics = self._apply_scenario(device_id, metrics, profile, scenario_mode)
        metrics = {name: round(float(value), 2) for name, value in metrics.items()}
        return {
            "deviceId": str(device_id),
            "deviceType": str(device_type),
            "scenarioMode": scenario_mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "isAnomaly": self._is_anomaly(metrics, profile),
            "metrics": metrics,
        }

    def generate_batch(self, device_id, device_type, count, scenario_mode):
        return [self.generate_reading(device_id, device_type, scenario_mode) for _ in range(int(count))]

    def get_device_health_state(self, metrics, device_type):
        if (
            metrics.get("cpuUsage", 0) > 85
            or metrics.get("memoryUsage", 0) > 88
            or metrics.get("packetLoss", 0) > 8
            or metrics.get("interfaceErrorCount", 0) > 15
            or metrics.get("restartFrequency", 0) > 3
            or metrics.get("uptimePattern", 100) < 85
        ):
            return "critical"
        if (
            metrics.get("cpuUsage", 0) > 70
            or metrics.get("memoryUsage", 0) > 78
            or metrics.get("packetLoss", 0) > 4
            or metrics.get("interfaceErrorCount", 0) > 8
            or metrics.get("restartFrequency", 0) > 1
            or metrics.get("uptimePattern", 100) < 92
        ):
            return "warning"
        return "healthy"

    def _normal_metrics(self, profile):
        metrics = {}
        for metric, ranges in profile.items():
            low = ranges.get("normal_min", ranges["min"])
            high = ranges["normal_max"]
            metrics[metric] = random.uniform(low, high)
        return metrics

    def _apply_scenario(self, device_id, metrics, profile, scenario_mode):
        adjusted = deepcopy(metrics)
        if scenario_mode == self.HIGH_CPU:
            adjusted["cpuUsage"] = random.uniform(80, 98)
            adjusted["memoryUsage"] = random.uniform(75, 95)
        elif scenario_mode == self.PACKET_LOSS:
            adjusted["packetLoss"] = random.uniform(8, 20)
            adjusted["interfaceErrorCount"] = random.uniform(10, 40)
        elif scenario_mode == self.RESTART:
            adjusted["restartFrequency"] = random.uniform(3, 8)
            adjusted["uptimePattern"] = random.uniform(70, 88)
        elif scenario_mode == self.HIGH_LATENCY:
            adjusted["latency"] = random.uniform(80, 150)
            adjusted["packetLoss"] = random.uniform(5, 15)
        elif scenario_mode == self.MEMORY_PRESSURE:
            adjusted["memoryUsage"] = random.uniform(80, 98)
            adjusted["diskUtilisation"] = random.uniform(75, 95)
        elif scenario_mode == self.RECOVERY:
            previous = self._recovery_state.get(device_id) or self._anomalous_start(profile)
            adjusted = self._recover(previous, profile)
            self._recovery_state[device_id] = deepcopy(adjusted)
        return adjusted

    def _anomalous_start(self, profile):
        metrics = self._normal_metrics(profile)
        metrics["cpuUsage"] = random.uniform(80, min(98, profile["cpuUsage"]["max"]))
        metrics["memoryUsage"] = random.uniform(80, min(98, profile["memoryUsage"]["max"]))
        metrics["packetLoss"] = random.uniform(8, max(8, profile["packetLoss"]["max"]))
        metrics["uptimePattern"] = random.uniform(profile["uptimePattern"]["min"], 88)
        return metrics

    def _recover(self, previous, profile):
        recovered = {}
        for metric, value in previous.items():
            ranges = profile[metric]
            target = ranges.get("normal_min", ranges["min"]) if metric == "uptimePattern" else ranges["normal_max"]
            recovered[metric] = value + ((target - value) * 0.2)
        return recovered

    def _is_anomaly(self, metrics, profile):
        for metric, value in metrics.items():
            ranges = profile[metric]
            if metric == "uptimePattern":
                if value < ranges.get("normal_min", ranges["min"]):
                    return True
            elif value > ranges["normal_max"]:
                return True
        return False
