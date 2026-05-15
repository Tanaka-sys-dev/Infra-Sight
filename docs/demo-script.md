# InfraSight Examiner Demonstration Guide

## System Overview
InfraSight is a Great Zimbabwe University ICT infrastructure monitoring and predictive maintenance prototype. It monitors devices, simulates telemetry, builds observation windows, predicts fault-prone states using a Random Forest model, generates alerts, validates scenarios, and presents dissertation evaluation evidence.

## Pre-Demo Checklist
1. Start backend with the correct virtual environment activated.
2. Open frontend in browser at `http://localhost:3000` or the active Vite URL.
3. Sign in with `admin@gzu.ac.zw` and `InfraSight@2026!`.
4. Enable Demo Mode from the dashboard header.
5. Confirm Firebase status shows live in `/api/firebase/status`.

## 5 Minute Demonstration Flow

### Minute 1: Dashboard Overview
- Show the 6 KPI cards.
- Show the device health grid with 5 device types.
- Point out the color coded health states.
- Show the recent alerts and predictions panels.

### Minute 2: Live Device Monitoring
- Click on the Admin Block Switch `sw-001`.
- Show the 8 KPI metric cards with color coding.
- Show the three telemetry charts.
- Click Simulate Reading and show chart update.

### Minute 3: Fault Prediction
- Navigate to Predictions page.
- Show the model info card with accuracy 100 percent.
- Show the feature importance chart.
- Show packetLoss as top predictor.
- Show the confusion matrix.
- Navigate back to device detail.
- Click Predict Now and show fault_prone classification.

### Minute 4: Alert Management
- Navigate to Alerts page.
- Show active critical alerts.
- Acknowledge an alert and show status change.
- Navigate to Scenarios page.
- Run High CPU Overload scenario on Main Server.
- Show prediction result and pass badge.

### Minute 5: Evaluation Evidence
- Navigate to Evaluation page.
- Show the improvement summary cards.
- Point out 81 percent fault detection time reduction.
- Show the before vs after comparison chart.
- Show the confusion matrix and feature importance.
- Click Export PDF Report to generate dissertation evidence.

## Key Talking Points
- Link each demonstrated feature to dissertation objectives.
- Emphasize the fault detection time improvement.
- Emphasize the Random Forest feature importance.
- Emphasize the live Firebase integration.
