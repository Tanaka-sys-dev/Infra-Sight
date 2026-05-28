const DEVICE_CODES = {
  server: 'SRV',
  switch: 'SW',
  router: 'RTR',
  access_point: 'AP',
  accesspoint: 'AP',
  workstation: 'WS',
}

export function canonicalDeviceId(deviceOrId, type = '') {
  const raw = typeof deviceOrId === 'object' ? (deviceOrId.id || deviceOrId.deviceId || deviceOrId.device_id || '') : (deviceOrId || '')
  const deviceType = typeof deviceOrId === 'object' ? (deviceOrId.type || type || '') : type
  const normalized = String(raw).toUpperCase().replace(/_/g, '-')
  const known = normalized.match(/^(SRV|SW|RTR|AP|WS)-?0*(\d+)$/)
  if (known) return `${known[1]}-${known[2].padStart(3, '0')}`
  const prefix = DEVICE_CODES[String(deviceType).toLowerCase().replace(/\s+/g, '_')] || normalized.split('-')[0] || 'DEV'
  const number = String(raw).match(/(\d+)/)?.[1] || '1'
  return `${prefix}-${number.padStart(3, '0')}`
}

export function canonicalDeviceName(device = {}) {
  const id = canonicalDeviceId(device)
  const type = String(device.type || 'Device').replace(/_/g, ' ')
  const label = type.replace(/\b\w/g, char => char.toUpperCase())
  if (device.name && /^[A-Z]{2,3}-\d{3}/.test(device.name)) return device.name
  return `${id} ${label}`
}

export function predictionLabel(value) {
  return String(value || 'normal').replace(/_/g, ' ')
}

export function dataSourceLabel() {
  return `Live Firebase Firestore · Historical Test Dataset · Last updated ${new Date().toLocaleString()}`
}

export function recommendedAction(alert = {}) {
  const message = `${alert.message || ''} ${alert.type || ''} ${alert.alert_type || ''}`.toLowerCase()
  if (message.includes('packet') || message.includes('interface')) return 'Inspect switch ports, uplinks, and packet-loss trend.'
  if (message.includes('cpu') || message.includes('memory')) return 'Check service load, running processes, and capacity threshold.'
  if (message.includes('restart') || message.includes('uptime')) return 'Review device stability, power, firmware, and recent restarts.'
  if ((alert.severity || '') === 'critical') return 'Escalate to ICT support lead and verify device health immediately.'
  if ((alert.severity || '') === 'warning') return 'Monitor next telemetry window and prepare maintenance action.'
  return 'Record observation and continue monitoring.'
}
