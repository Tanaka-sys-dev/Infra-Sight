from app.services.status_updater import StatusUpdater
from app.services.prediction_service import prediction_service
from app.simulation.simulator import TelemetrySimulator
from app.simulation.window_builder import WindowBuilder


class PollingJob:
    WINDOW_SIZE = 10
    BUFFER_MAX = 50

    def __init__(self, datastore):
        self.datastore = datastore
        self.simulator = TelemetrySimulator()
        self.window_builder = WindowBuilder()
        self.status_updater = StatusUpdater()
        self.readings_buffer = {}

    def poll_device(self, device_id, device_type, scenario_mode="normal"):
        reading = self.simulator.generate_reading(device_id, device_type, scenario_mode)
        return self.ingest_reading(device_id, device_type, reading)

    def ingest_reading(self, device_id, device_type, reading):
        buffer = self.readings_buffer.setdefault(device_id, [])
        buffer.append(reading)
        if len(buffer) > self.BUFFER_MAX:
            self.readings_buffer[device_id] = buffer[-self.BUFFER_MAX:]
            buffer = self.readings_buffer[device_id]
        status = self.status_updater.update_device_status(device_id, device_type, reading, datastore=self.datastore)
        window = None
        prediction = None
        alert = None
        if len(buffer) >= self.WINDOW_SIZE:
            window = self.window_builder.build_window(buffer[-self.WINDOW_SIZE:], device_id, device_type)
            if window:
                self.datastore.create_document("telemetry_windows", window["windowId"], window)
                prediction = prediction_service.predict_from_window(window, datastore=self.datastore)
                alert = prediction_service.create_predictive_alert(device_id, prediction, self.datastore, threshold=0.7)
            self.readings_buffer[device_id] = []
        return {
            "deviceId": device_id,
            "reading": reading,
            "window": window,
            "prediction": prediction,
            "alert": alert,
            "healthState": status["healthState"],
        }

    def poll_all_devices(self, devices):
        results = []
        for device in devices:
            device_id = device.get("deviceId") or device.get("id")
            device_type = device.get("type") or device.get("deviceType") or "server"
            if device_id:
                results.append(self.poll_device(device_id, device_type))
        return results
