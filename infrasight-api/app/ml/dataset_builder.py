import logging
import random
from pathlib import Path

import pandas as pd

from app.simulation.simulator import TelemetrySimulator
from app.simulation.window_builder import WindowBuilder

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "cpuUsage",
    "memoryUsage",
    "diskUtilisation",
    "packetLoss",
    "latency",
    "interfaceErrorCount",
    "restartFrequency",
    "uptimePattern",
]
LABEL_COLUMN = "label"
LABEL_MAP = {"normal": 0, "fault_prone": 1}


class DatasetBuilder:
    def __init__(self):
        self.simulator = TelemetrySimulator()
        self.window_builder = WindowBuilder()

    def build_from_simulator(self, n_samples=500, seed=42):
        rng = random.Random(seed)
        device_types = ["server", "switch", "router", "access_point", "workstation"]
        fault_scenarios = [
            "high_cpu_overload",
            "packet_loss_surge",
            "restart_instability",
            "high_latency",
            "memory_pressure",
        ]
        normal_count = n_samples // 2
        fault_count = n_samples - normal_count
        rows = []

        for index in range(normal_count):
            device_type = device_types[index % len(device_types)]
            device_id = f"sim-normal-{index:04d}"
            readings = self.simulator.generate_batch(device_id, device_type, 10, "normal")
            window = self.window_builder.build_window(readings, device_id, device_type)
            rows.append(self._row_from_window(window, "normal"))

        for index in range(fault_count):
            device_type = device_types[index % len(device_types)]
            scenario = fault_scenarios[index % len(fault_scenarios)]
            device_id = f"sim-fault-{index:04d}"
            readings = self.simulator.generate_batch(device_id, device_type, 10, scenario)
            window = self.window_builder.build_window(readings, device_id, device_type)
            rows.append(self._row_from_window(window, "fault_prone"))

        rng.shuffle(rows)
        return pd.DataFrame(rows, columns=[*FEATURE_COLUMNS, LABEL_COLUMN])

    def build_from_firestore(self, datastore):
        windows = datastore.list_documents("telemetry_windows")
        if len(windows) < 20:
            logger.warning("Firestore telemetry_windows has fewer than 20 documents; falling back to simulator dataset")
            return None
        rows = []
        for window in windows:
            try:
                rows.append(self._row_from_window(window))
            except (KeyError, TypeError, ValueError) as exc:
                logger.warning("Skipping invalid telemetry window %s: %s", window.get("id"), exc)
        if len(rows) < 20:
            logger.warning("Fewer than 20 valid telemetry windows were available after parsing")
            return None
        return pd.DataFrame(rows, columns=[*FEATURE_COLUMNS, LABEL_COLUMN])

    def prepare_features(self, df):
        X = df[FEATURE_COLUMNS].to_numpy(dtype=float)
        y = df[LABEL_COLUMN].to_numpy(dtype=int)
        return X, y

    def save_dataset(self, df, path):
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(target, index=False)
        return target

    def load_dataset(self, path):
        return pd.read_csv(path)

    def _row_from_window(self, window, label_override=None):
        features = window.get("features", {})
        row = {}
        for column in FEATURE_COLUMNS:
            value = features.get(column)
            if value is None:
                value = features.get(f"{column}_mean")
            if value is None:
                raise KeyError(column)
            row[column] = float(value)
        label = label_override or window.get("label", "normal")
        row[LABEL_COLUMN] = LABEL_MAP.get(label, 0)
        return row
