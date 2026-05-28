import React from 'react'

export interface SnmpLogViewerProps {
  log?: string
  title?: string
}

function highlight(line: string): React.ReactNode {
  const parts = [] as React.ReactNode[]
  const patterns = [
    { key: 'ERROR', className: 'redText' },
    { key: 'WARN', className: 'amber' },
    { key: 'INFO', className: 'blue' },
  ]
  let remaining = line
  let any = false
  for (const p of patterns) {
    if (remaining.includes(p.key)) {
      any = true
      const [before, after] = remaining.split(p.key)
      parts.push(before)
      parts.push(<span key={p.key} className={`badge ${p.className}`}>{p.key}</span>)
      parts.push(after)
      remaining = after
    }
  }
  if (!any) return line
  return <>{parts}</>
}

export function SnmpLogViewer({ log, title = 'SNMP / Syslog' }: SnmpLogViewerProps) {
  if (!log || !log.trim()) {
    return <div className="ui-empty"><strong>No SNMP/syslog data</strong><span>This device has no recent SNMP or syslog messages.</span></div>
  }
  const lines = log.split(/\r?\n/)
  return (
    <div className="panel" aria-label={title}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{title}</strong>
      </div>
      <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto', background: 'var(--surface-soft,#f8fafc)', border: '1px solid var(--border-soft,#e8eef3)', borderRadius: 10, padding: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12 }}>
        {lines.map((line, i) => <div key={i}>{highlight(line)}</div>)}
      </pre>
    </div>
  )
}

export default SnmpLogViewer
