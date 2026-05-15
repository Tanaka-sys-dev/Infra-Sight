import { telemetryAPI } from '../services/api'
import { useApiData } from '../services/useApiData'

export default function Telemetry() {
  const { data: telemetry, loading, error } = useApiData(telemetryAPI.getAll, 'telemetry')

  if (loading) return <div className="loading">Loading telemetry...</div>
  if (error) return <div className="error-box">Unable to load telemetry: {error}</div>

  return (
    <div className="telemetry-page"><div className="page-header"><h3>Telemetry</h3><p className="page-subtitle">Real-time device metrics and performance data</p></div><div className="table-container"><table className="data-table"><thead><tr><th>ID</th><th>Device</th><th>Metric</th><th>Value</th><th>Unit</th></tr></thead><tbody>{telemetry.map(tel => (<tr key={tel.id}><td>{tel.id}</td><td>{tel.device_id}</td><td>{tel.metric_name}</td><td className="metric-value">{tel.metric_value.toFixed(1)}</td><td>{tel.unit}</td></tr>))}</tbody></table></div><style>{`
.loading { text-align: center; padding: 40px; color: #666; } .error-box { background: #f8d7da; color: #721c24; padding: 16px; border-radius: 8px; } .page-header { margin-bottom: 24px; } .page-header h3 { font-size: 24px; margin-bottom: 8px; color: #333; } .page-subtitle { color: #666; font-size: 14px; } .table-container { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow-x: auto; } .data-table { width: 100%; border-collapse: collapse; } .data-table th { text-align: left; padding: 16px; font-size: 13px; color: #666; border-bottom: 2px solid #f0f0f0; font-weight: 600; } .data-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f0f0f0; } .metric-value { font-weight: 600; color: #0f3460; }
`}</style></div>
  )
}
