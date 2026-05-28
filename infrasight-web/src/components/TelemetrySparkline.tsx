import React from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'

export interface TelemetryPoint {
  timestamp: string
  value: number
}

export interface TelemetrySparklineProps {
  data: TelemetryPoint[]
  metricLabel: string
  threshold?: number
}

export function TelemetrySparkline({ data, metricLabel, threshold }: TelemetrySparklineProps) {
  const items = Array.isArray(data) ? data : []
  if (!items.length) return <div className="ui-empty"><strong>No telemetry</strong><span>No recent values available.</span></div>
  return (
    <div className="panel" aria-label={`${metricLabel} sparkline`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{metricLabel}</strong>
      </div>
      <div style={{ width: '100%', height: 140 }}>
        <ResponsiveContainer>
          <LineChart data={items} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
            <XAxis dataKey="timestamp" hide minTickGap={12} />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip formatter={(value: any) => [String(value), metricLabel]} labelFormatter={(label: any) => new Date(label).toLocaleTimeString()} />
            {typeof threshold === 'number' && <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TelemetrySparkline
