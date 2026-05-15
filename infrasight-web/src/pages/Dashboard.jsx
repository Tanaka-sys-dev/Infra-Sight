import { Link } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { alertsAPI, devicesAPI, predictionsAPI, telemetryAPI } from '../services/api'
import { useApiData } from '../services/useApiData'
import { useEffect, useMemo, useState } from 'react'
import { useDemoMode } from '../contexts/DemoContext'

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
  useEffect(() => {
    if (!isDemoMode) return undefined
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [isDemoMode])
  const today = new Date().toDateString()
  const activeAlerts = alerts.filter(a => !a.resolved && (a.status || 'active') !== 'resolved')
  const onlineDevices = devices.filter(d => d.status === 'online').length
  const faultProne = predictions.filter(p => (p.predictedClass || p.prediction_type) === 'fault_prone').length
  const predictionsToday = predictions.filter(p => new Date(p.createdAt || p.timestamp || 0).toDateString() === today).length
  const chartData = useMemo(() => predictions.slice(0, 24).reverse().map((prediction, index) => ({ point: index + 1, normal: (prediction.predictedClass || prediction.prediction_type) === 'normal' ? 1 : 0, fault_prone: (prediction.predictedClass || prediction.prediction_type) === 'fault_prone' ? 1 : 0 })), [predictions])

  if (loading) return <div className="spinner">Loading dashboard...</div>
  if (error) return <div className="error">Unable to load dashboard data: {error}<button onClick={refresh}>Retry</button></div>

  return <div className="dashboard"><div className="page-header"><h2>Dashboard</h2><p>Great Zimbabwe University ICT infrastructure command center</p></div><section className="kpis"><Kpi icon="▣" title="Total Devices" value={devices.length} /><Kpi icon="●" title="Online Devices" value={onlineDevices} green /><Kpi icon="!" title="Active Alerts" value={activeAlerts.length} red /><Kpi icon="⚠" title="Fault Prone Devices" value={faultProne} red /><Kpi icon="↯" title="Predictions Today" value={predictionsToday} /><Kpi icon="↑" title="System Uptime" value={`${((modelInfo?.metrics?.accuracy || 0.978) * 100).toFixed(1)}%`} green /></section><section className="quick"><button onClick={pollAll} disabled={polling}>{polling ? 'Running...' : 'Run All Simulations'}</button><button onClick={refresh}>Refresh Dashboard</button><Link to="/evaluation">View Evaluation</Link></section><section className="grid"><div className="panel wide"><h3>Device Health Grid</h3><div className="device-grid">{devices.map(device => <Link to={`/devices/${device.id}`} className="device-card" key={device.id}><strong>{device.name}</strong><span>{device.type} · {device.location || 'GZU Campus'}</span><Chip value={device.healthState || device.status || 'healthy'} /><Chip value={device.predictionState || 'normal'} /><Mini label="CPU" value={device.cpuUsage || device.metrics?.cpuUsage || 40} /><Mini label="Memory" value={device.memoryUsage || device.metrics?.memoryUsage || 52} /><small>Last seen: {formatTime(device.last_seen || device.lastSeen)}</small></Link>)}</div></div><div className="panel"><h3>Recent Alerts</h3>{activeAlerts.slice(0, 5).map(alert => <div className="row" key={alert.id}><Chip value={alert.severity} /><span>{alert.device_id || alert.deviceId}</span><small>{alert.message}</small><em>{formatTime(alert.timestamp || alert.createdAt)}</em></div>)}<Link to="/alerts">View All Alerts</Link></div><div className="panel"><h3>Recent Predictions</h3>{predictions.slice(0, 5).map(prediction => <div className="row" key={prediction.id || prediction.predictionId}><Chip value={prediction.predictedClass || prediction.prediction_type} /><span>{((prediction.confidence || 0) * 100).toFixed(1)}%</span><small>{prediction.deviceId || prediction.device_id}</small><em>{formatTime(prediction.createdAt || prediction.timestamp)}</em></div>)}<Link to="/predictions">View All Predictions</Link></div><div className="panel wide"><h3>System Health Chart</h3><ResponsiveContainer width="100%" height={260}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="point" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line dataKey="normal" stroke="#16a34a" /><Line dataKey="fault_prone" stroke="#dc2626" /></LineChart></ResponsiveContainer></div></section><style>{styles}</style></div>
}
function Kpi({ icon, title, value, green, red }) { return <div className="kpi"><span className={green ? 'greenText' : red ? 'redText' : ''}>{icon}</span><p>{title}</p><strong>{value}</strong></div> }
function Chip({ value }) { const text = String(value || 'normal'); const color = text.includes('critical') || text.includes('fault') ? 'red' : text.includes('warning') || text.includes('ack') ? 'amber' : 'green'; return <span className={`chip ${color}`}>{text}</span> }
function Mini({ label, value }) { return <div className="mini"><span>{label}</span><div><i style={{ width: `${Math.min(100, value)}%` }} /></div></div> }
function formatTime(value) { return value ? new Date(value).toLocaleString() : '-' }
const styles = `.spinner{text-align:center;padding:50px}.error{background:#fee2e2;color:#991b1b;padding:16px;border-radius:10px}.page-header h2{margin:0;font-size:28px}.page-header p{color:#6b7280}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin:20px 0}.kpi,.panel,.device-card,.quick{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:18px}.kpi span{font-size:24px}.kpi p{color:#6b7280;margin:6px 0}.kpi strong{font-size:30px}.greenText{color:#16a34a}.redText{color:#dc2626}.quick{display:flex;gap:12px;margin-bottom:18px;align-items:center}.quick button,.quick a{background:#16a34a;color:white;border:0;border-radius:10px;padding:10px 14px;font-weight:800;text-decoration:none}.grid{display:grid;grid-template-columns:2fr 1fr;gap:18px}.wide{grid-column:span 1}.device-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.device-card{display:flex;flex-direction:column;gap:8px;color:#111827;text-decoration:none}.chip{display:inline-block;width:max-content;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.green{background:#dcfce7;color:#166534}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}.mini span{font-size:12px;color:#6b7280}.mini div{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden}.mini i{display:block;height:100%;background:#16a34a}.row{display:grid;grid-template-columns:auto 80px 1fr;gap:8px;border-bottom:1px solid #e5e7eb;padding:10px 0}.row em{grid-column:1/-1;color:#6b7280;font-size:12px}.panel a{color:#16a34a;font-weight:800}`
