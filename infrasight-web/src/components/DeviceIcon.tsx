import React, { useMemo, useState } from 'react'
import type { DeviceClass } from '../data/infrastructureDevices'

export type DeviceState = 'normal' | 'warning' | 'critical' | 'maintenance' | 'offline'

export interface DeviceIconProps {
  deviceId: string
  deviceClass: DeviceClass
  model: string
  location: string
  state: DeviceState
  ipAddress?: string
  size?: number // px
  showLabel?: boolean
  onClick?: () => void
}

const STATE_COLOR: Record<DeviceState, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  maintenance: '#3b82f6',
  offline: '#6b7280',
}

function SwitchSVG({ color = '#0f172a', size = 48 }: { color?: string; size?: number }) {
  const s = size
  const portW = s * 0.08
  const gap = s * 0.04
  const startX = s * 0.18
  const startY = s * 0.6
  const ports = new Array(6).fill(0).map((_, i) => (
    <rect key={i} x={startX + i * (portW + gap)} y={startY} width={portW} height={s * 0.12} rx={s * 0.01} fill={color} opacity={0.9} />
  ))
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.1} y={s * 0.22} width={s * 0.8} height={s * 0.5} rx={s * 0.08} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.12} y={s * 0.26} width={s * 0.76} height={s * 0.18} rx={s * 0.04} fill="#94a3b8" opacity={0.35} />
      {ports}
    </svg>
  )
}

function RouterSVG({ color = '#0f172a', size = 48 }: { color?: string; size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <ellipse cx={s * 0.5} cy={s * 0.38} rx={s * 0.34} ry={s * 0.18} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.16} y={s * 0.38} width={s * 0.68} height={s * 0.24} rx={s * 0.06} fill="#e5e7eb" stroke="#cbd5e1" />
      <path d={`M ${s * 0.3} ${s * 0.54} L ${s * 0.7} ${s * 0.54}`} stroke={color} strokeWidth={2} />
      <path d={`M ${s * 0.5} ${s * 0.3} l ${s * 0.1} ${-s * 0.06} l ${-s * 0.1} ${-s * 0.06}`} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  )
}

function ServerSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.2} y={s * 0.22} width={s * 0.6} height={s * 0.18} rx={s * 0.04} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.2} y={s * 0.46} width={s * 0.6} height={s * 0.18} rx={s * 0.04} fill="#e5e7eb" stroke="#cbd5e1" />
      <circle cx={s * 0.72} cy={s * 0.31} r={s * 0.02} fill="#22c55e" />
      <circle cx={s * 0.72} cy={s * 0.55} r={s * 0.02} fill="#22c55e" />
    </svg>
  )
}

function WorkstationSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.18} y={s * 0.18} width={s * 0.64} height={s * 0.42} rx={s * 0.03} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.32} y={s * 0.62} width={s * 0.36} height={s * 0.06} rx={s * 0.02} fill="#cbd5e1" />
    </svg>
  )
}

function PrinterSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.18} y={s * 0.22} width={s * 0.64} height={s * 0.2} rx={s * 0.04} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.18} y={s * 0.42} width={s * 0.64} height={s * 0.24} rx={s * 0.04} fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x={s * 0.28} y={s * 0.16} width={s * 0.44} height={s * 0.06} rx={s * 0.01} fill="#cbd5e1" />
    </svg>
  )
}

function AccessPointSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.16} fill="#e5e7eb" stroke="#cbd5e1" />
      <path d={`M ${s * 0.5} ${s * 0.2} a ${s * 0.3} ${s * 0.3} 0 0 1 0 ${s * 0.6}`} stroke="#94a3b8" strokeWidth={2} fill="none" />
      <path d={`M ${s * 0.5} ${s * 0.28} a ${s * 0.22} ${s * 0.22} 0 0 1 0 ${s * 0.44}`} stroke="#94a3b8" strokeWidth={2} fill="none" />
    </svg>
  )
}

function MediaConverterSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.2} y={s * 0.28} width={s * 0.6} height={s * 0.28} rx={s * 0.06} fill="#e5e7eb" stroke="#cbd5e1" />
      <circle cx={s * 0.36} cy={s * 0.42} r={s * 0.04} fill="#94a3b8" />
      <rect x={s * 0.5} y={s * 0.4} width={s * 0.16} height={s * 0.06} rx={s * 0.01} fill="#94a3b8" />
    </svg>
  )
}

function UpsSVG({ size = 48 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <rect x={s * 0.28} y={s * 0.2} width={s * 0.44} height={s * 0.56} rx={s * 0.08} fill="#e5e7eb" stroke="#cbd5e1" />
      <polygon points={`${s * 0.5},${s * 0.32} ${s * 0.44},${s * 0.44} ${s * 0.56},${s * 0.44}`} fill="#f59e0b" />
    </svg>
  )
}

function iconFor(deviceClass: DeviceClass, size: number): React.ReactNode {
  switch (deviceClass) {
    case 'switch':
      return <SwitchSVG size={size} />
    case 'router':
      return <RouterSVG size={size} />
    case 'server':
      return <ServerSVG size={size} />
    case 'workstation':
      return <WorkstationSVG size={size} />
    case 'printer':
      return <PrinterSVG size={size} />
    case 'access_point':
      return <AccessPointSVG size={size} />
    case 'media_converter':
      return <MediaConverterSVG size={size} />
    case 'ups':
      return <UpsSVG size={size} />
    default:
      return <ServerSVG size={size} />
  }
}

export function DeviceIcon(props: DeviceIconProps) {
  const { deviceId, deviceClass, model, location, state, ipAddress, size = 48, showLabel = true, onClick } = props
  const [hover, setHover] = useState(false)
  const statusColor = STATE_COLOR[state]

  const label = useMemo(() => (
    <div style={{ maxWidth: Math.max(120, size * 2), textAlign: 'center' }}>
      <div style={{ fontWeight: 800, color: 'var(--text, #0f172a)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deviceId}</div>
      <div style={{ color: 'var(--text-muted, #64748b)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model}</div>
    </div>
  ), [deviceId, model, size])

  return (
    <div
      className="device-icon"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{ position: 'relative', display: 'inline-grid', justifyItems: 'center', gap: 6, cursor: onClick ? 'pointer' : 'default' }}
      aria-label={`${deviceId} ${model} ${state}`}
    >
      <div style={{ position: 'relative', width: size, height: size, borderRadius: size, background: '#fff', boxShadow: '0 4px 14px rgba(15,23,42,.12), inset 0 0 0 1px #e5e7eb', display: 'grid', placeItems: 'center' }}>
        {iconFor(deviceClass, Math.max(32, size * 0.84))}
        <span
          aria-hidden
          style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 999, background: statusColor, boxShadow: `0 0 0 2px #fff` }}
        />
      </div>
      {showLabel && label}
      {hover && (
        <div role="tooltip" style={{ position: 'absolute', transform: 'translateY(-100%)', marginTop: -8, background: 'var(--surface, #fff)', color: 'var(--text, #0f172a)', border: '1px solid var(--border-soft, #e5e7eb)', boxShadow: 'var(--shadow, 0 10px 24px rgba(15,23,42,.05))', padding: 10, borderRadius: 10, fontSize: 12, zIndex: 50 }}>
          <div><strong>{deviceId}</strong></div>
          <div style={{ color: 'var(--text-muted, #64748b)' }}>{model}</div>
          <div style={{ color: 'var(--text-muted, #64748b)' }}>{location}</div>
          {ipAddress && <div style={{ color: 'var(--text-muted, #64748b)' }}>{ipAddress}</div>}
          <div style={{ marginTop: 4 }}><span className="chip" style={{ background: '#eef2f7', borderColor: '#e2e8f0', textTransform: 'capitalize' }}>{state}</span></div>
        </div>
      )}
    </div>
  )
}

export default DeviceIcon
