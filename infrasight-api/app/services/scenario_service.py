from uuid import uuid4
from typing import List, Optional

from app.schemas.scenario import Scenario, ScenarioCreate, ScenarioResult
from app.services.firebase_service import datastore, timestamp_now
from app.services.prediction_service import prediction_service
from app.simulation.simulator import TelemetrySimulator
from app.simulation.window_builder import WindowBuilder


class ScenarioService:
    collection = "scenarios"

    def get_all(self) -> List[Scenario]:
        return [Scenario(**self._normalize(record)) for record in datastore.list_documents(self.collection)]

    def get_by_id(self, scenario_id: str) -> Optional[Scenario]:
        record = datastore.get_document(self.collection, scenario_id)
        return Scenario(**self._normalize(record)) if record else None

    def create(self, scenario_create: ScenarioCreate) -> Scenario:
        document_id = datastore.next_id(self.collection, "scen")
        record = datastore.create_document(
            self.collection,
            document_id,
            {**scenario_create.model_dump(), "created_at": timestamp_now(), "status": "ready"},
        )
        return Scenario(**record)

    def run_scenario(self, scenario_id: str) -> ScenarioResult:
        scenario = self.get_by_id(scenario_id)
        if scenario:
            return ScenarioResult(
                scenario_id=scenario_id,
                result="success",
                metrics={"duration_ms": 1500, "affected_devices": 3, "estimated_risk_reduction": 0.31},
            )
        return ScenarioResult(scenario_id=scenario_id, result="failed", metrics={})

    def run_and_predict(self, scenario_id: str, device_id: str, device_type: str, duration_seconds: int = 30) -> dict:
        scenario = self.get_by_id(scenario_id)
        scenario_mode = self._scenario_mode(scenario_id, scenario.name if scenario else scenario_id)
        simulator = TelemetrySimulator()
        window_builder = WindowBuilder()
        readings_count = max(10, min(60, int(duration_seconds)))
        readings = simulator.generate_batch(device_id, device_type, readings_count, scenario_mode)
        window = window_builder.build_window(readings[-10:], device_id, device_type, source="scenario")
        datastore.create_document("telemetry_windows", window["windowId"], window)
        prediction = prediction_service.predict_from_window(window, datastore=datastore)
        alert = prediction_service.create_predictive_alert(device_id, prediction, datastore, threshold=0.7)
        expected_class = "normal" if scenario_mode in {"normal", "recovery"} else "fault_prone"
        result = "pass" if prediction.get("predictedClass") == expected_class else "fail"
        run_id = str(uuid4())
        run = {
            "id": run_id,
            "runId": run_id,
            "scenarioId": scenario_id,
            "deviceId": device_id,
            "deviceType": device_type,
            "scenarioMode": scenario_mode,
            "simulatedReadings": readings_count,
            "window": {
                "windowId": window["windowId"],
                "label": window["label"],
                "features": window["features"],
            },
            "prediction": prediction,
            "alertGenerated": alert is not None,
            "alert": alert,
            "expectedClass": expected_class,
            "result": result,
            "createdAt": timestamp_now(),
        }
        datastore.create_document("scenario_runs", run_id, run)
        return run

    def get_runs(self, limit: int = 100) -> List[dict]:
        runs = datastore.list_documents("scenario_runs")
        return sorted(runs, key=lambda record: str(record.get("createdAt") or ""), reverse=True)[:limit]

    def _normalize(self, record: dict) -> dict:
        normalized = dict(record)
        normalized["name"] = normalized.get("name") or normalized.get("title") or normalized.get("faultType") or normalized.get("id")
        normalized["description"] = normalized.get("description") or normalized.get("summary") or normalized.get("faultType") or "Scenario"
        normalized["scenario_type"] = normalized.get("scenario_type") or normalized.get("scenarioType") or normalized.get("type") or normalized.get("faultType") or "analysis"
        normalized["created_at"] = normalized.get("created_at") or normalized.get("createdAt") or normalized.get("timestamp") or timestamp_now()
        normalized["status"] = normalized.get("status") or "ready"
        return normalized

    def _scenario_mode(self, scenario_id: str, name: str) -> str:
        value = f"{scenario_id} {name}".lower().replace("-", "_").replace(" ", "_")
        if "packet" in value or "loss" in value:
            return "packet_loss_surge"
        if "restart" in value or "instability" in value:
            return "restart_instability"
        if "latency" in value:
            return "high_latency"
        if "memory" in value:
            return "memory_pressure"
        if "recovery" in value or "normal" in value:
            return "normal"
        return "high_cpu_overload"


scenario_service = ScenarioService()
