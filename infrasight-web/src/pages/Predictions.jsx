import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { predictionsAPI } from '../services/api'

export default function Predictions() {
  const [predictions, setPredictions] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [training, setTraining] = useState(false)

  const loadData = async () => {
    const [predictionData, modelData] = await Promise.all([
      predictionsAPI.getPredictions(),
      predictionsAPI.getModelInfo(),
    ])
    setPredictions(predictionData || [])
    setModelInfo(modelData)
  }

  useEffect(() => {
    loadData().catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const filteredPredictions = useMemo(() => predictions.filter(prediction => {
    const predictedClass = prediction.predictedClass || prediction.prediction_type
    if (filter === 'normal') return predictedClass === 'normal'
    if (filter === 'fault_prone') return predictedClass === 'fault_prone'
    return true
  }), [predictions, filter])

  const retrain = async () => {
    setTraining(true)
    try {
      await predictionsAPI.retrainModel()
      await loadData()
    } finally {
      setTraining(false)
    }
  }

  if (loading) return <div className="loading">Loading predictions...</div>
  if (error) return <div className="error-box">Unable to load predictions: {error}</div>

  const metrics = modelInfo?.metrics || {}
  const featureImportance = modelInfo?.feature_importance || []
  const confusion = metrics.confusion_matrix || [[0, 0], [0, 0]]

  return (
    <div className="predictions-page">
      <div className="page-header"><h3>Random Forest Predictions</h3><p className="page-subtitle">Model-driven infrastructure fault prediction</p></div>
      <section className="model-card"><div><h4>Model {modelInfo?.model_version || 'rf-v1'}</h4><p>{modelInfo?.is_trained ? 'Trained and ready' : 'Not trained'}</p></div><button onClick={retrain} disabled={training}>{training ? 'Retraining...' : 'Retrain Model'}</button></section>
      <section className="metric-grid"><Metric title="Accuracy" value={metrics.accuracy} /><Metric title="Precision" value={metrics.precision} /><Metric title="Recall" value={metrics.recall} /><Metric title="F1 Score" value={metrics.f1_score} /></section>
      <section className="panel"><div className="filter-row">{['all', 'normal', 'fault_prone'].map(item => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item.replace('_', ' ')}</button>)}</div><table><thead><tr><th>Device ID</th><th>Predicted Class</th><th>Confidence</th><th>Top Feature</th><th>Timestamp</th></tr></thead><tbody>{filteredPredictions.map(prediction => <tr key={prediction.predictionId || prediction.id}><td>{prediction.deviceId || prediction.device_id}</td><td><span className={`chip ${(prediction.predictedClass || prediction.prediction_type) === 'fault_prone' ? 'red' : 'green'}`}>{prediction.predictedClass || prediction.prediction_type}</span></td><td>{((prediction.confidence || prediction.probability || 0) * 100).toFixed(1)}%</td><td>{prediction.topFeatures?.[0]?.name || '-'}</td><td>{formatTime(prediction.createdAt || prediction.timestamp)}</td></tr>)}</tbody></table></section>
      <section className="split"><div className="panel"><h4>Feature Importance</h4><ResponsiveContainer width="100%" height={320}><BarChart data={featureImportance} layout="vertical"><XAxis type="number" /><YAxis dataKey="feature" type="category" width={150} /><Tooltip /><Bar dataKey="importance" fill="#16a34a" /></BarChart></ResponsiveContainer></div><div className="panel"><h4>Confusion Matrix</h4><div className="matrix"><span></span><strong>Pred Normal</strong><strong>Pred Fault</strong><strong>Actual Normal</strong><b>{confusion[0]?.[0] || 0}</b><b>{confusion[0]?.[1] || 0}</b><strong>Actual Fault</strong><b>{confusion[1]?.[0] || 0}</b><b>{confusion[1]?.[1] || 0}</b></div></div></section>
      <style>{styles}</style>
    </div>
  )
}

function Metric({ title, value }) { return <div className="metric"><span>{title}</span><strong>{value != null ? `${(value * 100).toFixed(1)}%` : '-'}</strong></div> }
function formatTime(value) { return value ? new Date(value).toLocaleString() : '-' }

const styles = `
.loading{text-align:center;padding:40px}.error-box{background:#fee2e2;color:#991b1b;padding:16px;border-radius:10px}.page-header{margin-bottom:24px}.page-header h3{font-size:26px;margin:0;color:#111827}.page-subtitle{color:#6b7280}.model-card,.panel,.metric{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:20px}.model-card{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.model-card button,.filter-row button{border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}.model-card button{background:#16a34a;color:white}.model-card button:disabled{opacity:.6}.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:18px}.metric span{display:block;color:#6b7280;font-size:13px}.metric strong{font-size:30px;color:#111827}.filter-row{display:flex;gap:10px;margin-bottom:16px}.filter-row button{background:#e5e7eb;color:#374151;text-transform:capitalize}.filter-row button.active{background:#0f3460;color:white}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:13px;border-bottom:1px solid #e5e7eb}th{font-size:12px;color:#6b7280;text-transform:uppercase}.chip{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.green{background:#dcfce7;color:#166534}.red{background:#fee2e2;color:#991b1b}.split{display:grid;grid-template-columns:2fr 1fr;gap:18px;margin-top:18px}.matrix{display:grid;grid-template-columns:120px 1fr 1fr;gap:8px;align-items:center}.matrix strong,.matrix b{background:#f3f4f6;padding:14px;border-radius:10px;text-align:center}.matrix b{font-size:24px;color:#0f3460}
`
