import React, { useEffect, useMemo, useState } from 'react'
import { INFRASTRUCTURE_DEVICES, type InfrastructureDevice, type DeviceClass } from '../data/infrastructureDevices'
import DeviceIcon, { type DeviceState } from '../components/DeviceIcon'
import StateIndicator from '../components/StateIndicator'
import DeviceDetailDrawer from '../components/DeviceDetailDrawer'
import { EmptyState, ErrorState, SkeletonPage } from '../components/UI'
import { alertsAPI, devicesAPI } from '../services/api'
import { canonicalDeviceId } from '../utils/presentation'
import { FAULT_TYPES, type FaultType } from '../data/faultTypes'

// Location tabs shown in the UI
const LOCATION_TABS = [
  'Admin Block',
  'Bursary Department',
  'Server Room / Data Centre',
  'Computer Lab A',
  'Computer Lab B',
  'Library',
  'Network Closet',
] as const

type LocationTab = typeof LOCATION_TABS[number]

function toInventoryLocation(tab: LocationTab): string {
  if (tab === 'Server Room / Data Centre') return 'Server Room'
  return tab
}

function toDeviceClass(s: string): DeviceClass {
  const v = String(s || '').toLowerCase().replace(/\s+/g, '_') as DeviceClass
  if (['switch','router','server','workstation','printer','access_point','media_converter','ups'].includes(v)) return v
  return 'workstation'
}

interface LiveDeviceMap {
  byCanonicalId: Record<string, any>
  list: any[]
}

function buildLiveMap(devices: any[]): LiveDeviceMap {
  const byCanonicalId: Record<string, any> = {}
  for (const d of devices || []) {
    const key = canonicalDeviceId(d)
    byCanonicalId[key] = d
  }
  return { byCanonicalId, list: devices || [] }
}

function computeState(
  inventory: InfrastructureDevice,
  live: any | null,
  activeAlertsById: Map<string, { hasCritical: boolean; hasWarning: boolean }>
): DeviceState {
  const key = canonicalDeviceId(inventory.deviceId, inventory.deviceClass)
  const flags = activeAlertsById.get(key)
  const status = String(live?.status || '').toLowerCase()
  if (status === 'maintenance') return 'maintenance'
  if (status === 'offline') return 'offline'
  if (flags?.hasCritical) return 'critical'
  if (flags?.hasWarning) return 'warning'
  return 'normal'
}

export default function InfrastructurePage() {
  const [selectedTab, setSelectedTab] = useState<LocationTab>('Admin Block')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveMap, setLiveMap] = useState<LiveDeviceMap>({ byCanonicalId: {}, list: [] })
  const [activeAlertFlags, setActiveAlertFlags] = useState<Map<string, { hasCritical: boolean; hasWarning: boolean }>>(new Map())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [busyDeviceIds, setBusyDeviceIds] = useState<Record<string, boolean>>({})
  const [selectedFaultByDevice, setSelectedFaultByDevice] = useState<Record<string, string>>({})
  const [drawerInitTab, setDrawerInitTab] = useState<'overview' | 'telemetry' | 'faults' | 'actions'>('overview')
  const [drawerSteps, setDrawerSteps] = useState<string[] | undefined>(undefined)
  const [dynamicInventory, setDynamicInventory] = useState<InfrastructureDevice[]>([])
  const [addOpen, setAddOpen] = useState(false)
  type NewDevicePayload = { name: string; type: DeviceClass; status: string; location: string }
  const [newDevice, setNewDevice] = useState<NewDevicePayload>({ name: '', type: 'switch', status: 'online', location: 'Admin Block' })
  const [creating, setCreating] = useState(false)
  type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void }
  const [toasts, setToasts] = useState<Toast[]>([])

  const inventory = useMemo(() => [...INFRASTRUCTURE_DEVICES, ...dynamicInventory], [dynamicInventory])
  const inventoryEmpty = !inventory || inventory.length === 0

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [devices, alerts] = await Promise.all([
        devicesAPI.getAll(),
        alertsAPI.getAll({ status: 'active' }).catch(() => []), // tolerate alerts failure
      ])
      const map = buildLiveMap(devices)
      setLiveMap(map)
      // Build alert severity flags keyed by canonical id
      const flags = new Map<string, { hasCritical: boolean; hasWarning: boolean }>()
      for (const a of alerts || []) {
        const id = canonicalDeviceId(a.device_id || a.deviceId)
        const sev = String(a.severity || '').toLowerCase()
        const prev = flags.get(id) || { hasCritical: false, hasWarning: false }
        if (sev === 'critical') prev.hasCritical = true
        else if (sev === 'warning') prev.hasWarning = true
        flags.set(id, prev)
      }
      setActiveAlertFlags(flags)
      const staticKeys = new Set(INFRASTRUCTURE_DEVICES.map(d => canonicalDeviceId(d.deviceId, d.deviceClass)))
      const extra: InfrastructureDevice[] = []
      for (const d of devices || []) {
        const key = canonicalDeviceId(d)
        if (!staticKeys.has(key)) {
          extra.push({
            deviceId: d.id || d.deviceId || key,
            deviceClass: toDeviceClass(d.type || ''),
            model: String(d.model || 'Generic'),
            location: String(d.location || 'Admin Block'),
            ipAddress: String(d.ip_address || d.ipAddress || ''),
            macAddress: String(d.mac_address || d.macAddress || '00:00:00:00:00:00'),
          })
        }
      }
      setDynamicInventory(extra)
    } catch (err: any) {
      setError(err.message || 'Unable to load live device states')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancel = false
    load()
    const t = setInterval(() => { if (!cancel) load() }, 15000)
    return () => { cancel = true; clearInterval(t) }
  }, [])

  const locationLabel = selectedTab
  const location = toInventoryLocation(selectedTab)

  const filtered = useMemo(() => inventory.filter(d => d.location === location), [inventory, location])

  const devicesWithState = useMemo(() => filtered.map(device => {
    const canonical = canonicalDeviceId(device.deviceId, device.deviceClass)
    const live = liveMap.byCanonicalId[canonical] || null
    const state = computeState(device, live, activeAlertFlags)
    return { device, live, state, canonical }
  }), [filtered, liveMap, activeAlertFlags])

  const counts = useMemo(() => {
    const base = { normal: 0, warning: 0, critical: 0, maintenance: 0, offline: 0 }
    for (const item of devicesWithState) {
      base[item.state]++
    }
    return base
  }, [devicesWithState])

  const onDeviceClick = (item: { device: InfrastructureDevice; live: any; canonical: string }) => {
    // Prefer opening by live device id if available to ensure drawer API calls resolve
    const liveId = item.live?.id
    setDrawerInitTab('overview')
    setDrawerSteps(undefined)
    setSelectedDeviceId(liveId || item.device.deviceId)
    setDrawerOpen(true)
  }

  async function setDeviceState(item: { device: InfrastructureDevice; live: any; canonical: string }, newState: DeviceState) {
    const liveId: string = item.live?.id || item.device.deviceId
    // Confirm risky actions before proceeding
    if (newState === 'critical' || newState === 'offline') {
      const pick = newState === 'critical' ? faultForDevice(liveId, item.device.deviceClass, 'CRITICAL') : null
      const faultMsg = pick ? `${pick.faultCode}: ${pick.faultType}` : (newState === 'critical' ? 'critical state' : 'offline state')
      const deviceLabel = `${item.device.deviceId} · ${item.device.model}`
      const confirmText = newState === 'critical'
        ? `Confirm setting ${deviceLabel} to CRITICAL.\nThis will create a high-severity alert (${faultMsg}) and prompt remediation steps.\nProceed?`
        : `Confirm setting ${deviceLabel} to OFFLINE.\nThis will set the device status to offline and create a critical alert.\nProceed?`
      const ok = window.confirm(confirmText)
      if (!ok) return
    }
    setBusyDeviceIds(prev => ({ ...prev, [liveId]: true }))
    try {
      let chosen: FaultType | null = null
      if (newState === 'normal') {
        await devicesAPI.update(liveId, { status: 'online' })
        const existing = await alertsAPI.getByDevice(liveId)
        const unresolved = (existing || []).filter((a: any) => !a.resolved && (a.status || 'active') !== 'resolved')
        for (const a of unresolved) {
          try { await alertsAPI.resolve(a.id, 'operator', 'Manual restore to normal') } catch {}
        }
      } else if (newState === 'offline') {
        await devicesAPI.update(liveId, { status: 'offline' })
        await alertsAPI.create({ device_id: liveId, severity: 'critical', message: 'Manual state set: offline', alert_type: 'manual_state' })
      } else if (newState === 'maintenance') {
        await devicesAPI.update(liveId, { status: 'maintenance' })
        await alertsAPI.create({ device_id: liveId, severity: 'info', message: 'Manual state set: maintenance', alert_type: 'manual_state' })
      } else if (newState === 'warning') {
        await devicesAPI.update(liveId, { status: 'warning' })
        chosen = faultForDevice(liveId, item.device.deviceClass, 'WARNING')
        const message = chosen ? `${chosen.faultCode}: ${chosen.faultType}` : 'Manual state set: warning'
        const sev = chosen ? (chosen.severity as string).toLowerCase() : 'warning'
        await alertsAPI.create({ device_id: liveId, severity: sev, message, alert_type: 'manual_state' })
      } else if (newState === 'critical') {
        await devicesAPI.update(liveId, { status: 'warning' })
        chosen = faultForDevice(liveId, item.device.deviceClass, 'CRITICAL')
        const message = chosen ? `${chosen.faultCode}: ${chosen.faultType}` : 'Manual state set: critical'
        const sev = chosen ? (chosen.severity as string).toLowerCase() : 'critical'
        await alertsAPI.create({ device_id: liveId, severity: sev, message, alert_type: 'manual_state' })
      }
      await load()
      if (chosen && chosen.remediationSteps?.length) {
        setDrawerSteps(chosen.remediationSteps)
        setDrawerInitTab('actions')
      } else {
        setDrawerSteps(undefined)
        setDrawerInitTab('overview')
      }
      setSelectedDeviceId(liveId)
      setDrawerOpen(true)
      // Success toast with quick action to (re)open drawer on Actions
      const sevLabel = newState.charAt(0).toUpperCase() + newState.slice(1)
      const code = (chosen && (newState === 'warning' || newState === 'critical')) ? chosen.faultCode : ''
      const msg = (newState === 'normal')
        ? `${item.device.deviceId} restored to Normal`
        : code
          ? `${item.device.deviceId} set to ${sevLabel}: ${code}`
          : `${item.device.deviceId} set to ${sevLabel}`
      pushToast(msg, 'Open Actions', () => {
        if (chosen && chosen.remediationSteps?.length) {
          setDrawerSteps(chosen.remediationSteps)
        } else {
          setDrawerSteps(undefined)
        }
        setDrawerInitTab('actions')
        setSelectedDeviceId(liveId)
        setDrawerOpen(true)
      })
    } finally {
      setBusyDeviceIds(prev => ({ ...prev, [liveId]: false }))
    }
  }

  function StateOverrideSelect({ item }: { item: { device: InfrastructureDevice; live: any; canonical: string } }) {
    const liveId: string = item.live?.id || item.device.deviceId
    const busy = !!busyDeviceIds[liveId]
    return (
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>Set state</span>
        <select disabled={busy} onChange={(e) => { const v = e.target.value as DeviceState; if (v) setDeviceState(item, v) }} defaultValue="">
          <option value="" disabled>Choose…</option>
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
      </label>
    )
  }

  function faultForDevice(deviceId: string, deviceClass: DeviceClass, prefer: 'CRITICAL' | 'WARNING' | 'INFO' | null = null): FaultType | null {
    const chosenCode = selectedFaultByDevice[deviceId]
    const byClass = FAULT_TYPES.filter(f => f.deviceClass === deviceClass)
    if (chosenCode) {
      const m = byClass.find(f => f.faultCode === chosenCode)
      if (m) return m
    }
    if (prefer) {
      const p = byClass.find(f => f.severity === prefer)
      if (p) return p
    }
    return byClass[0] || null
  }

  function FaultPicker({ item }: { item: { device: InfrastructureDevice; live: any; canonical: string } }) {
    const liveId: string = item.live?.id || item.device.deviceId
    const options = useMemo(() => FAULT_TYPES.filter(f => f.deviceClass === item.device.deviceClass), [item.device.deviceClass])
    const value = selectedFaultByDevice[liveId] || ''
    return (
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>Fault</span>
        <select value={value} onChange={(e) => setSelectedFaultByDevice(prev => ({ ...prev, [liveId]: e.target.value }))}>
          <option value="">Auto</option>
          {options.map(opt => <option key={opt.faultCode} value={opt.faultCode}>{opt.faultCode} · {opt.faultType}</option>)}
        </select>
      </label>
    )
  }

  function pushToast(message: string, actionLabel?: string, onAction?: () => void) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts(prev => [...prev, { id, message, actionLabel, onAction }])
    // Auto-dismiss after 5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (inventoryEmpty) {
    return <div className="ui-page"><div className="page-header"><div><h2>Infrastructure</h2><p>Mirror of campus ICT assets with live health states.</p></div></div><EmptyState title="No infrastructure devices defined" detail="The inventory is empty. Populate src/data/infrastructureDevices.ts and reload." /></div>
  }

  if (loading) return <SkeletonPage variant="dashboard" />
  if (error) return <div className="ui-page"><div className="page-header"><div><h2>Infrastructure</h2><p>Mirror of campus ICT assets with live health states.</p></div></div><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="ui-page infrastructure-page">
      <div className="page-header">
        <div>
          <h2>Infrastructure</h2>
          <p>Mirror of campus ICT assets with live health states.</p>
        </div>
        <span className="source">Static inventory + Live device/alert state</span>
      </div>

      <div className="panel" style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="ui-button" onClick={() => setAddOpen(v => !v)}>{addOpen ? 'Close' : 'Add Device'}</button>
        </div>
        {addOpen && (
          <form onSubmit={async (e) => { e.preventDefault(); setCreating(true); try { await devicesAPI.create(newDevice); await load(); setNewDevice({ name: '', type: 'switch', status: 'online', location: 'Admin Block' }); setAddOpen(false) } finally { setCreating(false) } }} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input required placeholder="Name" value={newDevice.name} onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))} />
              <select value={newDevice.type} onChange={(e) => setNewDevice(prev => ({ ...prev, type: e.target.value as DeviceClass }))}>
                <option value="switch">Switch</option>
                <option value="router">Router</option>
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="printer">Printer</option>
                <option value="access_point">Access Point</option>
                <option value="media_converter">Media Converter</option>
                <option value="ups">UPS</option>
              </select>
              <select value={newDevice.status} onChange={(e) => setNewDevice(prev => ({ ...prev, status: e.target.value }))}>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
              <input required placeholder="Location" value={newDevice.location} onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))} />
              <button className="ui-button" type="submit" disabled={creating}>{creating ? 'Adding…' : 'Create Device'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Location Tabs */}
      <div className="panel" style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LOCATION_TABS.map(tab => (
            <button
              key={tab}
              className="ui-pill"
              onClick={() => setSelectedTab(tab)}
              style={{ background: tab === selectedTab ? 'var(--accent-soft)' : 'var(--surface-soft)', borderColor: tab === selectedTab ? '#99f6e4' : 'var(--border-soft)', color: tab === selectedTab ? 'var(--accent-strong)' : 'var(--text)' }}
            >{tab}</button>
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <StateIndicator state="normal" showLabel />
          <StateIndicator state="warning" showLabel />
          <StateIndicator state="critical" showLabel />
          <StateIndicator state="maintenance" showLabel />
          <StateIndicator state="offline" showLabel />
        </div>
        {/* KPIs */}
        <div className="kpis" style={{ margin: 0 }}>
          <div className="kpi"><p>Total Inventory</p><strong>{inventory.length}</strong><span>devices in infrastructureDevices.ts</span></div>
          <div className="kpi"><p>In View · Normal</p><strong>{counts.normal}</strong></div>
          <div className="kpi"><p>In View · Warning</p><strong className={counts.warning ? 'redText' : ''}>{counts.warning}</strong></div>
          <div className="kpi"><p>In View · Critical</p><strong className={counts.critical ? 'redText' : ''}>{counts.critical}</strong></div>
          <div className="kpi"><p>In View · Maintenance</p><strong>{counts.maintenance}</strong></div>
          <div className="kpi"><p>In View · Offline</p><strong>{counts.offline}</strong></div>
        </div>
      </div>

      {/* Location-specific layouts */}
      {location === 'Admin Block' && (
        <section className="split">
          <div className="panel">
            <h3>Rack</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {devicesWithState.filter(x => ['switch', 'media_converter', 'ups'].includes(x.device.deviceClass)).map(x => (
                <div key={x.device.deviceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <DeviceIcon
                    deviceId={x.device.deviceId}
                    deviceClass={x.device.deviceClass}
                    model={x.device.model}
                    location={x.device.location}
                    state={x.state}
                    ipAddress={x.device.ipAddress}
                    size={56}
                    onClick={() => onDeviceClick(x)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="muted">{x.device.model}</div>
                    <FaultPicker item={x} />
                    <StateOverrideSelect item={x} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3>Workspace</h3>
            <div className="device-grid">
              {devicesWithState.filter(x => ['workstation', 'printer', 'access_point'].includes(x.device.deviceClass)).map(x => (
                <div key={x.device.deviceId} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                  <DeviceIcon
                    deviceId={x.device.deviceId}
                    deviceClass={x.device.deviceClass}
                    model={x.device.model}
                    location={x.device.location}
                    state={x.state}
                    ipAddress={x.device.ipAddress}
                    onClick={() => onDeviceClick(x)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FaultPicker item={x} />
                    <StateOverrideSelect item={x} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {location === 'Bursary Department' && (
        <section className="panel">
          <h3>Bursary Department</h3>
          <div className="device-grid">
            {devicesWithState.filter(x => ['workstation', 'printer', 'access_point'].includes(x.device.deviceClass)).map(x => (
              <div key={x.device.deviceId} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {location === 'Server Room' && (
        <section className="panel">
          <h3>Server Room / Data Centre</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {devicesWithState.filter(x => ['server', 'ups'].includes(x.device.deviceClass)).map(x => (
              <div key={x.device.deviceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress, size: 56 }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="muted">{x.device.model}</div>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(location === 'Computer Lab A' || location === 'Computer Lab B') && (
        <section className="panel">
          <h3>{location}</h3>
          <div className="device-grid">
            {devicesWithState.filter(x => x.device.deviceClass === 'workstation').map(x => (
              <div key={x.device.deviceId} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
            {devicesWithState.filter(x => ['printer', 'access_point', 'switch'].includes(x.device.deviceClass)).map(x => (
              <div key={x.device.deviceId} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {location === 'Library' && (
        <section className="panel">
          <h3>Library</h3>
          <div className="device-grid">
            {devicesWithState.map(x => (
              <div key={x.device.deviceId} style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {location === 'Network Closet' && (
        <section className="panel">
          <h3>Network Closet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {devicesWithState.filter(x => ['switch', 'router', 'media_converter'].includes(x.device.deviceClass)).map(x => (
              <div key={x.device.deviceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <DeviceIcon {...{ deviceId: x.device.deviceId, deviceClass: x.device.deviceClass, model: x.device.model, location: x.device.location, state: x.state, ipAddress: x.device.ipAddress, size: 56 }} onClick={() => onDeviceClick(x)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="muted">{x.device.model}</div>
                  <FaultPicker item={x} />
                  <StateOverrideSelect item={x} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toasts */}
      {!!toasts.length && (
        <div aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, display: 'grid', gap: 8, zIndex: 70 }}>
          {toasts.map(t => (
            <div key={t.id} className="ui-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid var(--border-soft,#e5e7eb)', background: 'var(--surface,#fff)', boxShadow: 'var(--shadow, 0 6px 16px rgba(15,23,42,.08))' }}>
              <span style={{ fontWeight: 700 }}>{t.message}</span>
              <span style={{ flex: 1 }} />
              {t.actionLabel && <button className="ui-button" onClick={() => { dismissToast(t.id); t.onAction && t.onAction() }}>{t.actionLabel}</button>}
              <button aria-label="Dismiss" className="ui-button" onClick={() => dismissToast(t.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <DeviceDetailDrawer isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedDeviceId(null); setDrawerSteps(undefined); setDrawerInitTab('overview') }} deviceId={selectedDeviceId || ''} initialTab={drawerInitTab} forcedRemediationSteps={drawerSteps} />
    </div>
  )
}
