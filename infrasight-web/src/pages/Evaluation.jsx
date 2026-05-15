import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { evaluationAPI, predictionsAPI } from '../services/api'

const baseline = [
  { key: 'uptime', label: 'System Uptime', before: 92.4, after: 97.8, unit: '%', higherBetter: true },
  { key: 'incidents', label: 'Recorded Incidents', before: 37, after: 44, unit: '', higherBetter: false },
  { key: 'faultDetectionTime', label: 'Fault Detection Time', before: 96, after: 18, unit: ' min', higherBetter: false },
  { key: 'responseTime', label: 'Response Time', before: 142, after: 49, unit: ' min', higherBetter: false },
  { key: 'outageDuration', label: 'Outage Duration', before: 128, after: 41, unit: ' min', higherBetter: false },
]

export default function Evaluation() {
  const [summary, setSummary] = useState(null)
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([evaluationAPI.getSummary(), evaluationAPI.getSystemMetrics(), predictionsAPI.getModelInfo()])
      .then(([summaryData, systemData, modelData]) => { setSummary(summaryData); setSystemMetrics(systemData); setModelInfo(modelData) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => baseline.map(item => ({ metric: item.label, Before: item.before, After: item.after })), [])
  const exportReport = () => {
    const report = { generatedAt: new Date().toISOString(), baseline, modelMetrics: modelInfo?.metrics, systemMetrics, summary }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'infrasight-evaluation-report.json'; link.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="spinner">Loading evaluation dashboard...</div>
  if (error) return <div className="error">Unable to load evaluation data: {error}<button onClick={() => location.reload()}>Retry</button></div>

  const metrics = modelInfo?.metrics || summary?.modelMetrics || {}
  const confusion = metrics.confusion_matrix || [[0, 0], [0, 0]]
  const features = modelInfo?.feature_importance || summary?.featureImportance || []

  return <div className="evaluation-page"><div className="page-header"><div><h3>Evaluation</h3><p>Dissertation evidence dashboard for Great Zimbabwe University InfraSight</p></div><button onClick={exportReport}>Export Evaluation Report</button></div><section className="compare-grid">{baseline.map(item => <Comparison key={item.key} item={item} />)}</section><section className="summary-grid"><BigMetric value="81%" label="Reduction in Fault Detection Time" /><BigMetric value="65%" label="Reduction in Response Time" /><BigMetric value="68%" label="Reduction in Outage Duration" /><BigMetric value="5.4%" label="Improvement in Uptime" /></section><section className="metric-grid"><Metric title="Accuracy" value={metrics.accuracy} /><Metric title="Precision" value={metrics.precision} /><Metric title="Recall" value={metrics.recall} /><Metric title="F1 Score" value={metrics.f1_score || metrics.f1Score} /><Metric title="Model Version" raw={modelInfo?.model_version || metrics.modelVersion || 'rf-v1'} /><Metric title="Training Samples" raw={(metrics.n_train_samples || 0) + (metrics.n_test_samples || 0)} /></section><section className="panel"><h4>Confusion Matrix</h4><div className="matrix"><span></span><strong>Predicted Normal</strong><strong>Predicted Fault Prone</strong><strong>Actual Normal</strong><b className="good">{confusion[0]?.[0] || 0}<small>True Negative</small></b><b className="bad">{confusion[0]?.[1] || 0}<small>False Positive</small></b><strong>Actual Fault Prone</strong><b className="warn">{confusion[1]?.[0] || 0}<small>False Negative</small></b><b className="good">{confusion[1]?.[1] || 0}<small>True Positive</small></b></div></section><section className="panel"><h4>Random Forest Feature Importance</h4><ResponsiveContainer width="100%" height={360}><BarChart data={features} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={value => `${(value * 100).toFixed(0)}%`} /><YAxis type="category" dataKey="feature" width={150} /><Tooltip formatter={value => `${(value * 100).toFixed(1)}%`} /><Bar dataKey="importance" fill="#16a34a" /></BarChart></ResponsiveContainer></section><section className="panel"><h4>Before vs After Operational Metrics</h4><ResponsiveContainer width="100%" height={320}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="metric" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Before" fill="#f59e0b" /><Bar dataKey="After" fill="#16a34a" /></BarChart></ResponsiveContainer></section><section className="summary-grid"><BigMetric value={systemMetrics?.devicesMonitored || 0} label="Total Devices Monitored" /><BigMetric value={systemMetrics?.windowsBuilt || 0} label="Telemetry Windows Built" /><BigMetric value={systemMetrics?.totalPredictions || 0} label="Predictions Made" /><BigMetric value={systemMetrics?.activeAlerts || 0} label="Active Alerts" /><BigMetric value={systemMetrics?.faultPronePredictions || 0} label="Fault Prone Predictions" /><BigMetric value={systemMetrics?.normalPredictions || 0} label="Normal Predictions" /></section><style>{styles}</style></div>
}

function improvement(item) { return item.higherBetter ? ((item.after - item.before) / item.before) * 100 : ((item.before - item.after) / item.before) * 100 }
function Comparison({ item }) { const value = improvement(item); return <div className={`comparison ${value >= 0 ? 'improved' : 'regressed'}`}><h4>{item.label}</h4><div><span>Before <strong>{item.before}{item.unit}</strong></span><span>After <strong>{item.after}{item.unit}</strong></span></div><p>{Math.abs(value).toFixed(1)}% {value >= 0 ? 'improvement' : 'regression'}</p></div> }
function BigMetric({ value, label }) { return <div className="big"><strong>{value}</strong><span>{label}</span></div> }
function Metric({ title, value, raw }) { return <div className="metric"><span>{title}</span><strong>{raw ?? (value != null ? `${(value * 100).toFixed(1)}%` : '-')}</strong></div> }
const styles = `.spinner{text-align:center;padding:60px}.error{background:#fee2e2;color:#991b1b;padding:16px;border-radius:10px}.error button,.page-header button{margin-left:12px}.page-header{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:20px}.page-header h3{font-size:28px;margin:0;color:#111827}.page-header p{color:#6b7280}.page-header button,button{background:#16a34a;color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800}.compare-grid,.summary-grid,.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:18px}.comparison,.big,.metric,.panel{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:20px}.comparison{border-left:5px solid #16a34a}.comparison.regressed{border-color:#dc2626}.comparison h4{margin:0 0 12px}.comparison div{display:flex;justify-content:space-between}.comparison span,.metric span,.big span{display:block;color:#6b7280;font-size:13px}.comparison strong,.metric strong{font-size:22px;color:#111827}.comparison p{font-weight:800;color:#16a34a}.big strong{font-size:38px;color:#16a34a}.matrix{display:grid;grid-template-columns:150px 1fr 1fr;gap:10px}.matrix strong,.matrix b{padding:16px;border-radius:12px;text-align:center;background:#f3f4f6}.matrix b{font-size:30px}.matrix small{display:block;font-size:11px}.good{background:#dcfce7!important;color:#166534}.bad{background:#fee2e2!important;color:#991b1b}.warn{background:#fef3c7!important;color:#92400e}.panel{margin-bottom:18px}`
