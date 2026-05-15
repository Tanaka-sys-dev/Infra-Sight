import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { alertsAPI, devicesAPI, predictionsAPI, telemetryAPI } from '../services/api'

const metrics = [
  ['cpuUsage', 'CPU Usage', '%'],
  ['memoryUsage', 'Memory Usage', '%'],
  ['diskUtilisation', 'Disk Utilisation', '%'],
  ['packetLoss', 'Packet Loss', '%'],
  ['latency', 'Latency', 'ms'],
  ['interfaceErrorCount', 'Interface Errors', ''],
  ['restartFrequency', 'Restart Frequency', ''],
  ['uptimePattern', 'Uptime Pattern', '%'],
]

export default function DeviceDetail() {
  const { deviceId } = useParams()
  const [device, setDevice] = useState(null)
  const [stream, setStream] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)

  const loadData = async () => {
    const [deviceData, streamData, alertData, predictionData] = await Promise.all([
      devicesAPI.getById(deviceId),
      telemetryAPI.getTelemetryStream(deviceId, 20),
      alertsAPI.getByDevice(deviceId),
      predictionsAPI.getPredictionByDevice(deviceId),
    ])
    setDevice(deviceData)
    setStream(streamData.readings || [])
    setAlerts(alertData || [])
    setPrediction(predictionData)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (active) setError('')
        await loadData()
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [deviceId])

  const chartData = useMemo(() => stream.map(reading => ({
    time: new Date(reading.timestamp).toLocaleTimeString(),
    ...reading.metrics,
  })), [stream])

  const current = stream.length ? stream[stream.length - 1].metrics : {}
  const predictedClass = prediction?.predictedClass || device?.predictionState || device?.prediction_state || 'normal'
  const topFeatures = prediction?.topFeatures || []

  const simulate = async () => {
    if (!device) return
    setSimulating(true)
    try {
      await telemetryAPI.simulateDevice(device.id, device.type, 'normal', 1)
      await loadData()
    } finally {
      setSimulating(false)
    }
  }

  const predictNow = async () => {
    if (!device || !current || !Object.keys(current).length) return
    setPredicting(true)
    try {
      const result = await predictionsAPI.predictDevice(device.id, device.type, current)
      setPrediction(result)
      await loadData()
    } finally {
      setPredicting(false)
    }
  }

  if (loading) return <div className="loading">Loading device...</div>
  if (error) return <div className="error-box">Unable to load device: {error}</div>
  if (!device) return <div className="error-box">Device not found</div>

  return (
    <div className="device-detail">
      <section className="detail-header">
        <div><h2>{device.name}</h2><p>{device.location || 'Unknown location'}</p></div>
        <span className="badge blue">{device.type}</span>
        <span className={`badge ${statusColor(device.status)}`}>{device.status}</span>
        <span className={`badge ${predictedClass === 'fault_prone' ? 'red' : 'green'}`}>{predictedClass}</span>
        <span className="muted">Last seen: {formatTime(device.last_seen || device.lastSeen)}</span>
      </section>

      <section className="kpi-grid">
        {metrics.map(([key, label, unit]) => <div className={`kpi ${metricState(key, current[key])}`} key={key}><span>{label}</span><strong>{current[key] ?? '-'}{current[key] != null ? unit : ''}</strong></div>)}
      </section>

      <div className="action-row"><button className="primary-button" onClick={simulate} disabled={simulating}>{simulating ? 'Simulating...' : 'Simulate Reading'}</button><button className="secondary-button" onClick={predictNow} disabled={predicting || !Object.keys(current).length}>{predicting ? 'Predicting...' : 'Predict Now'}</button></div>

      <section className="charts">
        <TelemetryChart title="CPU and Memory" data={chartData} lines={[['cpuUsage', '#2563eb'], ['memoryUsage', '#7c3aed']]} />
        <TelemetryChart title="Latency and Packet Loss" data={chartData} lines={[['latency', '#ea580c'], ['packetLoss', '#dc2626']]} />
        <TelemetryChart title="Errors and Restarts" data={chartData} lines={[['interfaceErrorCount', '#ca8a04'], ['restartFrequency', '#be123c']]} />
      </section>

      <section className="panel"><h3>Random Forest Prediction</h3><div className="prediction-header"><span className={`badge ${predictedClass === 'fault_prone' ? 'red' : 'green'}`}>{predictedClass}</span><strong>{((prediction?.confidence || 0) * 100).toFixed(0)}%</strong></div><div className="confidence-track"><span style={{ width: `${Math.round((prediction?.confidence || 0) * 100)}%` }} /></div><ResponsiveContainer width="100%" height={180}><BarChart data={topFeatures} layout="vertical"><XAxis type="number" /><YAxis dataKey="name" type="category" width={140} /><Tooltip /><Bar dataKey="value" fill="#16a34a" /></BarChart></ResponsiveContainer><p>Model: {prediction?.modelVersion || 'rf-v1'}</p><p>Last prediction: {formatTime(prediction?.createdAt || prediction?.timestamp)}</p></section>

      <section className="panel"><h3>Recent Alerts</h3>{alerts.slice(0, 5).map(alert => <div className="alert-row" key={alert.id}><span className={`badge ${alert.severity === 'critical' ? 'red' : 'amber'}`}>{alert.severity}</span><span>{alert.message}</span><span>{alert.resolved ? 'resolved' : 'active'}</span><span>{formatTime(alert.timestamp)}</span></div>)}</section>

      <style>{styles}</style>
    </div>
  )
}

function TelemetryChart({ title, data, lines }) {
  return <div className="chart-card"><h3>{title}</h3><ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend />{lines.map(([key, color]) => <Line key={key} type="monotone" dataKey={key} stroke={color} dot={false} />)}</LineChart></ResponsiveContainer></div>
}

function metricState(key, value = 0) {
  if (key === 'uptimePattern') return value < 85 ? 'critical' : value < 92 ? 'warning' : 'healthy'
  if (['cpuUsage'].includes(key)) return value > 85 ? 'critical' : value > 70 ? 'warning' : 'healthy'
  if (['memoryUsage'].includes(key)) return value > 88 ? 'critical' : value > 78 ? 'warning' : 'healthy'
  if (['packetLoss'].includes(key)) return value > 8 ? 'critical' : value > 4 ? 'warning' : 'healthy'
  if (['interfaceErrorCount'].includes(key)) return value > 15 ? 'critical' : value > 8 ? 'warning' : 'healthy'
  if (['restartFrequency'].includes(key)) return value > 3 ? 'critical' : value > 1 ? 'warning' : 'healthy'
  return 'healthy'
}

function statusColor(status) { return status === 'offline' ? 'red' : status === 'warning' ? 'amber' : 'green' }
function formatTime(value) { return value ? new Date(value).toLocaleString() : '-' }

const styles = `
.loading { text-align:center; padding:40px; } .error-box { background:#fee2e2; color:#991b1b; padding:16px; border-radius:10px; }
.detail-header { display:flex; align-items:center; gap:14px; flex-wrap:wrap; background:white; padding:24px; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,.08); margin-bottom:20px; }
.detail-header h2 { margin:0; color:#111827; } .detail-header p { margin:4px 0 0; color:#6b7280; }
.badge { padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; } .green{background:#dcfce7;color:#166534}.amber{background:#fef3c7;color:#92400e}.red{background:#fee2e2;color:#991b1b}.blue{background:#dbeafe;color:#1e40af}.muted{color:#6b7280;font-size:13px}
.kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin-bottom:20px; } .kpi { background:white; padding:18px; border-radius:12px; border-left:5px solid #16a34a; box-shadow:0 2px 8px rgba(0,0,0,.08); } .kpi.warning{border-color:#f59e0b}.kpi.critical{border-color:#dc2626}.kpi span{display:block;color:#6b7280;font-size:13px}.kpi strong{font-size:26px;color:#111827}
.action-row{display:flex;gap:12px;margin-bottom:20px}.primary-button,.secondary-button{border:0;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer}.primary-button{background:#0f3460;color:white}.secondary-button{background:#16a34a;color:white}.primary-button:disabled,.secondary-button:disabled{opacity:.6}
.charts { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; margin-bottom:20px; }.chart-card,.panel{background:white;padding:20px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)}.prediction-text{font-size:28px;font-weight:800;color:#0f3460}.alert-row{display:grid;grid-template-columns:100px 1fr 90px 180px;gap:10px;padding:10px 0;border-bottom:1px solid #e5e7eb;align-items:center}
.prediction-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.prediction-header strong{font-size:30px;color:#111827}.confidence-track{height:10px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-bottom:16px}.confidence-track span{display:block;height:100%;background:#16a34a}
`
