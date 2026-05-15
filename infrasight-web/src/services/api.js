const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${endpoint}`)
  }

  return response.json()
}

export const api = {
  get: (endpoint) => fetchAPI(endpoint),
  post: (endpoint, data = {}) => fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => fetchAPI(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => fetchAPI(endpoint, {
    method: 'DELETE',
  }),
}

export const devicesAPI = {
  getAll: () => api.get('/api/devices'),
  getById: (deviceId) => api.get(`/api/devices/${deviceId}`),
}

export const alertsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString()
    return api.get(`/api/alerts${query ? `?${query}` : ''}`)
  },
  acknowledge: (alertId, userId = 'system') => api.post(`/api/alerts/${alertId}/acknowledge`, { userId }),
  resolve: (alertId, userId = 'system', resolutionNote = '') => api.post(`/api/alerts/${alertId}/resolve`, { userId, resolutionNote }),
  getByDevice: async (deviceId) => {
    const alerts = await api.get('/api/alerts')
    return alerts.filter(alert => alert.device_id === deviceId || alert.deviceId === deviceId)
  },
}

export const predictionsAPI = {
  getAll: () => api.get('/api/predictions'),
  getPredictions: () => api.get('/api/predictions?limit=100'),
  getPredictionByDevice: (deviceId) => api.get(`/api/predictions/${deviceId}`),
  predictDevice: (deviceId, deviceType, features) => api.post('/api/predictions/predict', { deviceId, deviceType, features }),
  getModelInfo: () => api.get('/api/predictions/model/info'),
  retrainModel: () => api.post('/api/predictions/model/train'),
}

export const scenariosAPI = {
  getAll: () => api.get('/api/scenarios'),
  runAndPredict: (scenarioId, deviceId, deviceType, durationSeconds = 30) => api.post('/api/scenarios/run-and-predict', { scenarioId, deviceId, deviceType, durationSeconds }),
  getRuns: () => api.get('/api/scenarios/runs?limit=100'),
}

export const evaluationAPI = {
  getAll: () => api.get('/api/evaluation'),
  getSummary: () => api.get('/api/evaluation/summary'),
  getSystemMetrics: () => api.get('/api/evaluation/system-metrics'),
}

export const telemetryAPI = {
  getAll: () => api.get('/api/telemetry'),
  simulateDevice: (deviceId, deviceType, scenarioMode = 'normal', count = 1) => api.post('/api/telemetry/simulate', { deviceId, deviceType, scenarioMode, count }),
  getTelemetryStream: (deviceId, limit = 20) => api.get(`/api/telemetry/stream/${deviceId}?limit=${limit}`),
  ingestTelemetry: (deviceId, deviceType, metrics, scenarioMode = 'normal') => api.post('/api/telemetry/ingest', { deviceId, deviceType, metrics, scenarioMode }),
  pollAllDevices: () => api.post('/api/telemetry/poll'),
}

export const settingsAPI = {
  getAll: () => api.get('/api/firebase/collections/settings'),
  getFirebaseStatus: () => api.get('/api/firebase/status'),
}

export const getDeviceById = devicesAPI.getById
export const getAlertsByDevice = alertsAPI.getByDevice
export const simulateDevice = telemetryAPI.simulateDevice
export const getTelemetryStream = telemetryAPI.getTelemetryStream
export const ingestTelemetry = telemetryAPI.ingestTelemetry
export const pollAllDevices = telemetryAPI.pollAllDevices
