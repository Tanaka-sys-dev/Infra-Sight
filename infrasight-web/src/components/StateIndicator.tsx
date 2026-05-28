import React from 'react'
import type { DeviceState } from './DeviceIcon'

export interface StateIndicatorProps {
  state: DeviceState
  showLabel?: boolean
}

const STATE_COLOR: Record<DeviceState, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  maintenance: '#3b82f6',
  offline: '#6b7280',
}

export function StateIndicator({ state, showLabel = true }: StateIndicatorProps) {
  const color = STATE_COLOR[state]
  const pulse = state === 'critical'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden
        className={pulse ? 'pulse-dot' : ''}
        style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: `0 0 0 2px rgba(255,255,255,.9)` }}
      />
      {showLabel && <span style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: 12 }}>{state}</span>}
      {/* Local keyframes for pulse to avoid touching global CSS in this phase */}
      {pulse && (
        <style>{`
          @keyframes infra-pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,.6);} 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0);} 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0);} }
          .pulse-dot { animation: infra-pulse-red 1.5s ease-in-out infinite; }
        `}</style>
      )}
    </div>
  )
}

export default StateIndicator
