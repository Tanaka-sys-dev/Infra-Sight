import React, { useEffect, useMemo, useState } from 'react'
import { alertsAPI, devicesAPI, predictionsAPI, telemetryAPI } from '../services/api'
import { EmptyState, ErrorState, SkeletonPage } from './UI'
import { DeviceIcon, type DeviceState } from './DeviceIcon'
import StateIndicator from './StateIndicator'
import FaultBadge from './FaultBadge'
import TelemetrySparkline, { type TelemetryPoint } from './TelemetrySparkline'
import RemediationSteps from './RemediationSteps'
import SnmpLogViewer from './SnmpLogViewer'
import { canonicalDeviceId, canonicalDeviceName, predictionLabel, recommendedAction } from '../utils/presentation'
import { FAULT_SCENARIOS } from '../data/faultScenarios'
import { FAULT_TYPES, type FaultType } from '../data/faultTypes'

export interface DeviceDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  deviceId: string
  initialTab?: TabKey
  forcedRemediationSteps?: string[]
}

type TabKey = 'overview' | 'telemetry' | 'faults' | 'actions'

function deriveState(device: any, alerts: any[]): DeviceState {
  const active = (alerts || []).filter(a => !a.resolved && (a.status || 'active') !== 'resolved')
  const hasCritical = active.some(a => String(a.severity || '').toLowerCase() === 'critical')
  const hasWarning = active.some(a => String(a.severity || '').toLowerCase() === 'warning')
  if (hasCritical) return 'critical'
  if (hasWarning) return 'warning'
  const status = String(device?.status || '').toLowerCase()
  if (status === 'offline') return 'offline'
  if (status === 'maintenance') return 'maintenance'
  return 'normal'
}

function formatTime(value?: any) { return value ? new Date(value).toLocaleString() : '-' }

export function DeviceDetailDrawer({ isOpen, onClose, deviceId, initialTab, forcedRemediationSteps }: DeviceDetailDrawerProps) {
  const [tab, setTab] = useState<TabKey>(initialTab || 'overview')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [device, setDevice] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [prediction, setPrediction] = useState<any>(null)
  const [stream, setStream] = useState<any[]>([])
  const [simulating, setSimulating] = useState(false)
  const [predicting, setPredicting] = useState(false)

  useEffect(() => {
    if (!isOpen || !deviceId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [d, s, a, p] = await Promise.all([
          devicesAPI.getById(deviceId),
          telemetryAPI.getTelemetryStream(deviceId, 20),
          alertsAPI.getByDevice(deviceId),
          predictionsAPI.getPredictionByDevice(deviceId),
        ])
        if (!cancelled) {
          setDevice(d)
          setStream(s?.readings || [])
          setAlerts(a || [])
          setPrediction(p || null)
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unable to load device detail')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [isOpen, deviceId])

  // If initialTab isn't provided, auto-switch to Actions when there are actionable alerts
  useEffect(() => {
    if (!isOpen) return
    if (initialTab) return
    const hasManual = alerts.some((a: any) => (a.alert_type || a.type) === 'manual_state')
    const hasSev = alerts.some((a: any) => {
      const s = String(a.severity || '').toLowerCase()
      return s === 'critical' || s === 'warning'
    })
    if (hasManual || hasSev) setTab('actions')
  }, [isOpen, initialTab, alerts])

  const lastMetrics = useMemo(() => (stream.length ? stream[stream.length - 1].metrics || {} : {}), [stream])
  const deviceState: DeviceState = deriveState(device, alerts)
  const cpuData: TelemetryPoint[] = useMemo(() => stream.slice(-10).map((r: any) => ({ timestamp: r.timestamp, value: r.metrics?.cpuUsage ?? 0 })), [stream])
  const memData: TelemetryPoint[] = useMemo(() => stream.slice(-10).map((r: any) => ({ timestamp: r.timestamp, value: r.metrics?.memoryUsage ?? 0 })), [stream])

  function pickFaultByClass(deviceClass: string, prefer: 'CRITICAL' | 'WARNING' | 'INFO' | null): FaultType | undefined {
    const cls = String(deviceClass || '').toLowerCase()
    const list = FAULT_TYPES.filter(f => f.deviceClass === cls)
    if (prefer) {
      const m = list.find(f => f.severity === prefer)
      if (m) return m
    }
    return list[0]
  }

  function deriveStepsFromAlerts(): string[] | undefined {
    const list = Array.isArray(alerts) ? alerts.slice().reverse() : []
    for (const a of list) {
      const msg = `${a.message || a.title || ''}`
      const match = FAULT_TYPES.find(f => msg.includes(f.faultCode))
      if (match && match.remediationSteps && match.remediationSteps.length) return match.remediationSteps
    }
    // Fallback: if there is a manual_state alert, pick steps by device class + severity
    const manual = list.find(a => (a.alert_type || a.type) === 'manual_state')
    if (manual && device) {
      const sev = String(manual.severity || '').toLowerCase()
      const prefer = sev === 'critical' ? 'CRITICAL' : sev === 'warning' ? 'WARNING' : null
      const guess = pickFaultByClass(device.type || 'server', prefer)
      if (guess && guess.remediationSteps && guess.remediationSteps.length) return guess.remediationSteps
    }
    return undefined
  }

  const DEFAULT_STEPS = [
    'Verify physical connections and link lights.',
    'Check device logs for recent errors.',
    'Apply pending firmware/OS updates if approved.',
    'Re-test and monitor telemetry for 10 minutes.',
  ]

  const stepsToShow = useMemo(() => {
    if (forcedRemediationSteps && forcedRemediationSteps.length) return forcedRemediationSteps
    const derived = deriveStepsFromAlerts()
    if (derived && derived.length) return derived
    return DEFAULT_STEPS
  }, [forcedRemediationSteps, alerts, device])

  const simulate = async () => {
    if (!device) return
    setSimulating(true)
    try {
      await telemetryAPI.simulateDevice(device.id, device.type || 'server', 'normal', 1)
      const s = await telemetryAPI.getTelemetryStream(deviceId, 20)
      setStream(s?.readings || [])
    } finally {
      setSimulating(false)
    }
  }

  const runPrediction = async () => {
    if (!device || !Object.keys(lastMetrics || {}).length) return
    setPredicting(true)
    try {
      const result = await predictionsAPI.predictDevice(device.id, device.type || 'server', lastMetrics)
      setPrediction(result)
    } finally {
      setPredicting(false)
    }
  }

  const scenariosForDevice = useMemo(() => FAULT_SCENARIOS.filter(s => (s.affectedDevices || []).includes(deviceId)), [deviceId])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay background */}
      <div onClick={onClose} aria-hidden style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.28)', zIndex: 55 }} />
      <aside role="dialog" aria-label="Device details" aria-modal className="drawer" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 92vw)', background: 'var(--surface,#fff)', borderLeft: '1px solid var(--border-soft,#e8eef3)', boxShadow: 'var(--shadow, 0 10px 24px rgba(15,23,42,.05))', zIndex: 60, display: 'grid', gridTemplateRows: 'auto auto 1fr' }}>
      <div className="drawer-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: '1px solid var(--border-soft,#e8eef3)' }}>
        <strong>Device</strong>
        <button onClick={onClose} className="ui-button">Close</button>
      </div>

      {loading ? (
        <div className="spinner" style={{ padding: 20 }}><SkeletonPage variant="dashboard" /></div>
      ) : error ? (
        <div style={{ padding: 16 }}><ErrorState message={error} onRetry={() => { /* no-op in drawer */ }} /></div>
      ) : !device ? (
        <div style={{ padding: 16 }}><EmptyState title="Device not found" detail="Select a valid device." /></div>
      ) : (
        <>
          {/* Header */}
          <div className="panel" style={{ margin: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 12, alignItems: 'center' }}>
              <DeviceIcon deviceId={canonicalDeviceId(device)} deviceClass={(device.type || 'server') as any} model={canonicalDeviceName(device)} location={device.location || 'GZU Campus'} state={deviceState} ipAddress={(device.ipAddress || device.ip) as any} size={56} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{canonicalDeviceId(device)} · {canonicalDeviceName(device)}</div>
                <div className="muted">{device.location || 'GZU Campus'} · {device.type}</div>
                <div className="muted">Last seen: {formatTime(device.last_seen || device.lastSeen)}</div>
              </div>
              <div style={{ justifySelf: 'end' }}>
                <StateIndicator state={deviceState} showLabel />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="panel" style={{ margin: '0 14px 14px 14px' }}>
            <div role="tablist" aria-label="Device detail tabs" style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-soft,#e8eef3)' }}>
              {(['overview', 'telemetry', 'faults', 'actions'] as TabKey[]).map(key => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className="ui-button" style={{ background: tab === key ? 'var(--accent,#0f766e)' : 'var(--surface,#fff)', color: tab === key ? '#fff' : 'var(--text,#0f172a)' }}>{key[0].toUpperCase() + key.slice(1)}</button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
                <div className="kpis" style={{ margin: 0 }}>
                  {['cpuUsage','memoryUsage','diskUtilisation','packetLoss','latency'].map((key) => (
                    <div key={key} className="kpi"><span>{key}</span><strong>{lastMetrics?.[key] != null ? lastMetrics[key] : '-'}{lastMetrics?.[key] != null && (key === 'latency' ? ' ms' : key === 'packetLoss' ? ' %' : '%')}</strong></div>
                  ))}
                </div>
                <div className="panel">
                  <h3>Latest Prediction</h3>
                  <div className="prediction-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className={`badge ${((prediction?.predictedClass || prediction?.prediction_type) === 'fault_prone') ? 'red' : 'green'}`}>{predictionLabel(prediction?.predictedClass || prediction?.prediction_type || 'normal')}</span>
                    <strong>{(((prediction?.confidence || 0) as number) * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="confidence-track"><span style={{ width: `${Math.round(((prediction?.confidence || 0) as number) * 100)}%` }} /></div>
                  <div className="row">
                    {(prediction?.topFeatures || []).slice(0,3).map((f: any) => <div key={f.name}><strong>{f.name}</strong><div className="muted">value: {f.value}</div></div>)}
                  </div>
                </div>
              </div>
            )}

            {tab === 'telemetry' && (
              <div style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
                <TelemetrySparkline data={cpuData} metricLabel="CPU Usage" threshold={70} />
                <TelemetrySparkline data={memData} metricLabel="Memory Usage" threshold={78} />
                <div className="panel">
                  <h3>Recent Readings</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead><tr><th>Time</th><th>CPU%</th><th>Mem%</th><th>Disk%</th><th>Loss%</th><th>Latency</th><th>Errors</th><th>Restarts</th><th>Uptime%</th></tr></thead>
                      <tbody>
                        {stream.slice(-10).reverse().map((r: any, i: number) => (
                          <tr key={i}><td>{formatTime(r.timestamp)}</td><td>{r.metrics?.cpuUsage ?? '-'}</td><td>{r.metrics?.memoryUsage ?? '-'}</td><td>{r.metrics?.diskUtilisation ?? '-'}</td><td>{r.metrics?.packetLoss ?? '-'}</td><td>{r.metrics?.latency ?? '-'}</td><td>{r.metrics?.interfaceErrorCount ?? '-'}</td><td>{r.metrics?.restartFrequency ?? '-'}</td><td>{r.metrics?.uptimePattern ?? '-'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'faults' && (
              <div style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
                {!alerts.length ? <div className="ui-empty"><strong>No active faults</strong><span>This device has no active/unresolved alerts.</span></div> : (
                  <div className="panel">
                    <h3>Active/Recent Alerts</h3>
                    {alerts.map((a: any) => (
                      <div key={a.id} className="row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', gap: 10 }}>
                        <FaultBadge severity={String(a.severity || 'INFO').toUpperCase() as any} label={(a.severity || '').toString()} />
                        <div>
                          <div style={{ fontWeight: 800 }}>{a.message || a.title || 'Alert'}</div>
                          <div className="muted">{recommendedAction(a)}</div>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>{formatTime(a.timestamp || a.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <SnmpLogViewer log={''} />
              </div>
            )}

            {tab === 'actions' && (
              <div style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
                <div className="panel" style={{ display: 'grid', gap: 10 }}>
                  <h3>Actions</h3>
                  <div className="row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="ui-button" onClick={simulate} disabled={simulating}>{simulating ? 'Collecting…' : 'Simulate Telemetry'}</button>
                    <button className="ui-button" onClick={runPrediction} disabled={predicting || !Object.keys(lastMetrics || {}).length}>{predicting ? 'Classifying…' : 'Run Prediction'}</button>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Trigger Scenario
                      <select onChange={(e) => { /* placeholder; Phase 5 will call API */ }} defaultValue="">
                        <option value="" disabled>Choose…</option>
                        {scenariosForDevice.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="panel">
                  <h3>Remediation Checklist</h3>
                  <RemediationSteps steps={stepsToShow} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      </aside>
    </>
  )
}

export default DeviceDetailDrawer
