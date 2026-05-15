# Sprint 4: Random Forest Prediction Engine

## Overview
Sprint 4 adds a Random Forest prediction layer to InfraSight. It uses Sprint 3 telemetry observation windows as training and inference input, classifies devices as `normal` or `fault_prone`, stores predictions in Firestore, and generates predictive alerts when confidence is high.

## Model Architecture
The prediction model is a scikit-learn `RandomForestClassifier` configured with:

- `n_estimators`: 200
- `test_size`: 0.3, using a 70/30 train/test split
- `class_weight`: `balanced`
- `random_state`: 42
- `max_depth`: None
- `min_samples_split`: 2
- `min_samples_leaf`: 1

## Training Dataset
The dataset is built by `DatasetBuilder` from either simulator output or Firestore `telemetry_windows` documents.

Feature columns:

- `cpuUsage`
- `memoryUsage`
- `diskUtilisation`
- `packetLoss`
- `latency`
- `interfaceErrorCount`
- `restartFrequency`
- `uptimePattern`

Labels are encoded as:

- `normal`: 0
- `fault_prone`: 1

Simulator training produces a balanced dataset with normal windows and mixed fault scenarios: `high_cpu_overload`, `packet_loss_surge`, `restart_instability`, `high_latency`, and `memory_pressure`. Firestore training is used when at least 20 valid telemetry windows are available; otherwise the system falls back to simulator-generated data.

## Model Performance
On the balanced synthetic dataset, the model is expected to exceed 0.80 accuracy. In the current Sprint 4 verification runs it achieved perfect synthetic-data metrics because the simulator scenarios are intentionally separable for dissertation demonstration.

Tracked metrics:

- Accuracy: overall correct predictions
- Precision: correctness of predicted fault-prone classifications
- Recall: ability to detect actual fault-prone windows
- F1 Score: harmonic mean of precision and recall
- Confusion matrix: actual vs predicted normal and fault-prone windows

## Feature Importance
Feature importance is computed from the trained Random Forest feature importances and sorted descending. The ranking helps explain which telemetry signals contributed most to prediction decisions. Fault-related signals such as packet loss, latency, restart frequency, CPU usage, and interface errors are expected to rank highly depending on simulator mix and Firestore data.

## Prediction Pipeline
The prediction flow is:

1. Telemetry reading is generated or ingested.
2. The polling job buffers readings per device.
3. A telemetry window is built from 10 readings.
4. Window features are extracted in the model feature order.
5. The Random Forest classifies the window as `normal` or `fault_prone`.
6. A confidence score is computed from prediction probabilities.
7. The prediction is saved to Firestore `predictions`.
8. A predictive alert is generated when `fault_prone` confidence exceeds the configured threshold.

## API Endpoints
Sprint 4 adds or extends these endpoints:

- `GET /api/predictions`
- `GET /api/predictions/{device_id}`
- `POST /api/predictions/predict`
- `POST /api/predictions/predict-window`
- `GET /api/predictions/model/info`
- `POST /api/predictions/model/train`
- `GET /api/evaluation/summary`
- `GET /api/evaluation/system-metrics`
- `POST /api/scenarios/run-and-predict`

## Scenario Integration
The scenario runner can now simulate a fault scenario, build a window, run prediction, save the window and prediction, generate alerts, and save the result to `scenario_runs`. A run passes when the predicted class matches the expected class for the scenario mode.

## Evaluation Metrics
Evaluation summary responses include model metrics, feature importance, and system-level counts:

- total predictions
- fault-prone predictions
- normal predictions
- active alerts
- monitored devices
- telemetry windows built
