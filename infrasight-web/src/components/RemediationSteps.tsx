import React, { useMemo, useState } from 'react'

export interface RemediationStepsProps {
  steps: string[]
}

export function RemediationSteps({ steps }: RemediationStepsProps) {
  const [done, setDone] = useState<Record<number, boolean>>({})
  const toggle = (index: number) => setDone(prev => ({ ...prev, [index]: !prev[index] }))
  const items = useMemo(() => steps || [], [steps])

  if (!items.length) return <div className="ui-empty"><strong>No steps provided</strong><span>There are no remediation steps available.</span></div>

  return (
    <div className="panel" role="list" aria-label="Remediation steps">
      {items.map((step, index) => (
        <div key={index} className="row" role="listitem" style={{ display: 'grid', gridTemplateColumns: '24px 1fr', alignItems: 'start', gap: 10 }}>
          <input type="checkbox" aria-label={`Mark step ${index + 1} as done`} checked={!!done[index]} onChange={() => toggle(index)} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-muted,#64748b)' }}>Step {index + 1}</div>
            <div style={{ textDecoration: done[index] ? 'line-through' : 'none', color: done[index] ? '#94a3b8' : 'var(--text,#0f172a)' }}>{step}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RemediationSteps
