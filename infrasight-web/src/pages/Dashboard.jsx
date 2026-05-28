import { Link } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { alertsAPI, devicesAPI, predictionsAPI, telemetryAPI } from '../services/api'
import { useApiData } from '../services/useApiData'
import { useEffect, useMemo, useState } from 'react'
import { useDemoMode } from '../contexts/DemoContext'
import { ErrorState, SkeletonPage } from '../components/UI'
import { canonicalDeviceId, canonicalDeviceName, dataSourceLabel, predictionLabel, recommendedAction } from '../utils/presentation'

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [polling, setPolling] = useState(false)
  const { isDemoMode } = useDemoMode()
  const devicesState = useApiData(devicesAPI.getAll, `devices-${refreshKey}`)
  const alertsState = useApiData(alertsAPI.getAll, `alerts-${refreshKey}`)
  const predictionsState = useApiData(predictionsAPI.getPredictions, `predictions-${refreshKey}`)
  const modelState = useApiData(predictionsAPI.getModelInfo, `model-${refreshKey}`)
  const loading = devicesState.loading || alertsState.loading || predictionsState.loading || modelState.loading
  const error = devicesState.error || alertsState.error || predictionsState.error || modelState.error
  const devices = devicesState.data || []
  const alerts = alertsState.data || []
  const predictions = predictionsState.data || []
  const modelInfo = modelState.data || {}
  const refresh = () => setRefreshKey(value => value + 1)
  const pollAll = async () => { setPolling(true); try { await telemetryAPI.pollAllDevices(); refresh() } finally { setPolling(false) } }
  useEffect(() => { if (!isDemoMode) return undefined; const interval = setInterval(refresh, 10000); return () => clearInterval(interval) }, [isDemoMode])
  const activeAlerts = useMemo(() => {
    const items = alerts.filter(a => !a.resolved && (a.status || 'active') !== 'resolved')
    const map = new Map()
    for (const a of items) {
      const id = canonicalDeviceId(a.device_id || a.deviceId)
      const key = `${id}|${(a.message || '').toLowerCase()}|${a.severity || ''}|${a.alert_type || a.type || ''}`
      const ts = new Date(a.timestamp || a.createdAt || 0).getTime()
      const prev = map.get(key)
      if (!prev || ts > prev._ts) {
        map.set(key, { ...a, _ts: ts })
      }
    }
    return Array.from(map.values())
  }, [alerts])
  const faultPredictions = predictions.filter(p => (p.predictedClass || p.prediction_type) === 'fault_prone')
  const impactedDeviceIds = new Set([...activeAlerts.map(a => canonicalDeviceId(a.device_id || a.deviceId)), ...faultPredictions.map(p => canonicalDeviceId(p.deviceId || p.device_id))])
  const onlineDevices = devices.filter(d => d.status === 'online').length
  const modelAccuracy = modelInfo?.metrics?.accuracy || 0
  const chartData = useMemo(() => predictions.slice(0, 24).reverse().map((prediction, index) => ({ point: index + 1, Normal: (prediction.predictedClass || prediction.prediction_type) === 'normal' ? 1 : 0, 'Fault Prone': (prediction.predictedClass || prediction.prediction_type) === 'fault_prone' ? 1 : 0 })), [predictions])

  if (loading) return <SkeletonPage />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return <div className="dashboard"><div className="page-header"><div><h2>ICT Fault Monitoring Dashboard</h2><p>Near real-time campus infrastructure status, ML fault prediction, and alert workflow.</p></div><span className="source">{dataSourceLabel()}</span></div><section className="kpis"><Kpi title="Monitored Assets" value={devices.length} note="registered devices" /><Kpi title="Online Assets" value={`${onlineDevices}/${devices.length}`} note="currently reachable" green /><Kpi title="Active Alerts" value={activeAlerts.length} note="unresolved actions" red={activeAlerts.length > 0} /><Kpi title="Fault-Prone Assets" value={impactedDeviceIds.size} note="prediction or alert risk" red={impactedDeviceIds.size > 0} /><Kpi title="Model Accuracy" value={modelAccuracy ? `${(modelAccuracy * 100).toFixed(1)}%` : '-'} note="Random Forest rf-v1" green /><Kpi title="Prediction Events" value={predictions.length} note="historical test dataset" /></section><section className="quick"><button onClick={pollAll} disabled={polling}>{polling ? 'Processing Telemetry...' : 'Run Telemetry Poll'}</button><button onClick={refresh}>Refresh View</button><Link to="/evaluation">View Evaluation Evidence</Link></section><section className="grid"><div className="panel wide"><h3>Campus Asset Health</h3><div className="device-grid">{devices.map(device => { const id = canonicalDeviceId(device); const predicted = device.predictionState || device.prediction_state || (impactedDeviceIds.has(id) ? 'fault_prone' : 'normal'); return <Link to={`/devices/${device.id}`} className="device-card" key={device.id}><strong>{id}</strong><b>{canonicalDeviceName(device)}</b><span>{device.type} · {device.location || 'GZU Campus'}</span><Chip value={device.healthState || device.status || 'healthy'} /><Chip value={predictionLabel(predicted)} /><Mini label="CPU" value={device.cpuUsage || device.metrics?.cpuUsage || 40} /><Mini label="Memory" value={device.memoryUsage || device.metrics?.memoryUsage || 52} /><small>Last seen: {formatTime(device.last_seen || device.lastSeen)}</small></Link> })}</div></div><div className="panel"><h3>Priority Alerts</h3>{activeAlerts.slice(0, 5).map(alert => <div className="row" key={alert.id}><Chip value={alert.severity} /><span>{canonicalDeviceId(alert.device_id || alert.deviceId)}</span><small>{alert.message}</small><em>{recommendedAction(alert)}</em></div>)}{activeAlerts.length === 0 && <p className="empty">No unresolved alerts in the current monitoring window.</p>}<Link to="/alerts">Open Alert Workflow</Link></div><div className="panel"><h3>Recent Prediction Output</h3>{predictions.slice(0, 5).map(prediction => <div className="row" key={prediction.id || prediction.predictionId}><Chip value={predictionLabel(prediction.predictedClass || prediction.prediction_type)} /><span>{canonicalDeviceId(prediction.deviceId || prediction.device_id)}</span><small>{((prediction.confidence || prediction.probability || 0) * 100).toFixed(1)}% confidence</small><em>{formatTime(prediction.createdAt || prediction.timestamp)}</em></div>)}<Link to="/predictions">Review Model Evidence</Link></div><div className="panel wide"><h3>Prediction Trend by Telemetry Window</h3><ResponsiveContainer width="100%" height={260}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="point" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="Normal" stroke="#16a34a" /><Line type="monotone" dataKey="Fault Prone" stroke="#dc2626" /></LineChart></ResponsiveContainer></div></section><style>{styles}</style></div>
}
function Kpi({ title, value, note, green, red }) { return <div className="kpi"><p>{title}</p><strong className={green ? 'greenText' : red ? 'redText' : ''}>{value}</strong><span>{note}</span></div> }
function Chip({ value }) { const text = String(value || 'normal'); const color = text.includes('critical') || text.includes('fault') ? 'red' : text.includes('warning') || text.includes('ack') ? 'amber' : 'green'; return <span className={`chip ${color}`}>{text}</span> }
function Mini({ label, value }) { return <div className="mini"><span>{label}</span><div><i style={{ width: `${Math.min(100, value)}%` }} /></div></div> }
function formatTime(value) { return value ? new Date(value).toLocaleString() : '-' }
const styles = `.spinner{text-align:center;padding:50px}.error{background:#fee2e2;color:#991b1b;padding:16px;border-radius:10px}.page-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.page-header h2{margin:0;font-size:28px;color:#111827}.page-header p{color:#6b7280;margin:6px 0}.source{font-size:12px;color:#2b6e60;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:999px;padding:7px 11px;white-space:nowrap}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin:20px 0}.kpi,.panel,.device-card,.quick{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:18px}.kpi p{color:#6b7280;margin:0 0 8px}.kpi strong{font-size:30px;color:#111827}.kpi span{display:block;color:#6b7280;font-size:12px;margin-top:4px}.greenText{color:#16a34a!important}.redText{color:#dc2626!important}.quick{display:flex;gap:12px;margin-bottom:18px;align-items:center;flex-wrap:wrap}.quick button,.quick a{background:#16a34a;color:white;border:0;border-radius:10px;padding:10px 14px;font-weight:800;text-decoration:none}.quick button:disabled{opacity:.6}.grid{display:grid;grid-template-columns:2fr 1fr;gap:18px}.wide{grid-column:span 1}.device-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.device-card{display:flex;flex-direction:column;gap:7px;color:#111827;text-decoration:none}.device-card strong{font-size:20px;color:#2b6e60}.device-card b{font-size:14px}.device-card span{color:#6b7280}.chip{display:inline-block;width:max-content;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;text-transform:capitalize}.green{background:#dcfce7;color:#166534}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}.mini span{font-size:12px;color:#6b7280}.mini div{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden}.mini i{display:block;height:100%;background:#16a34a}.row{display:grid;grid-template-columns:auto 82px 1fr;gap:8px;border-bottom:1px solid #e5e7eb;padding:10px 0}.row em{grid-column:1/-1;color:#6b7280;font-size:12px}.panel a{color:#16a34a;font-weight:800}.empty{color:#6b7280}`
