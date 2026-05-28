import React from 'react'
import type { Severity } from '../data/faultTypes'

export interface FaultBadgeProps {
  severity: Severity
  label?: string
}

function classFor(sev: Severity) {
  switch (sev) {
    case 'CRITICAL':
      return 'chip red'
    case 'WARNING':
      return 'chip amber'
    case 'INFO':
      return 'chip blue'
    default:
      return 'chip'
  }
}

export function FaultBadge({ severity, label }: FaultBadgeProps) {
  const text = (label || severity || '').toString()
  return <span className={classFor(severity)}>{text}</span>
}

export default FaultBadge
