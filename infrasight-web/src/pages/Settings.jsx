import { useEffect, useState } from 'react'
import { predictionsAPI, settingsAPI } from '../services/api'
import { ErrorState, SkeletonPage } from '../components/UI'

const defaults = {
  cpuWarning: 70,
  memoryWarning: 78,
  packetLossWarning: 4,
  latencyWarning: 60,
  interfaceErrorWarning: 8,
  uptimeCritical: 85,
  pollingInterval: 30,
}

export default function Settings() {
  const [thresholds, setThresholds] = useState(defaults)
  const [modelInfo, setModelInfo] = useState(null)
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [training, setTraining] = useState(false)

  useEffect(() => {
    Promise.all([settingsAPI.getAll(), predictionsAPI.getModelInfo(), settingsAPI.getFirebaseStatus()])
      .then(([settings, model, firebase]) => {
        const first = Array.isArray(settings) ? settings[0] : settings
        setThresholds({ ...defaults, ...(first?.thresholds || first || {}) })
        setModelInfo(model)
        setSystemInfo(firebase)
      })
      .catch(error => setMessage(`Unable to load settings: ${error.message}`))
      .finally(() => setLoading(false))
  }, [])

  const update = (key, value) => setThresholds(previous => ({ ...previous, [key]: Number(value) }))
  const save = () => setMessage('Settings saved locally for this demonstration session.')
  const retrain = async () => {
    setTraining(true)
    try {
      const result = await predictionsAPI.retrainModel()
      setModelInfo(result.modelInfo)
      setMessage('Model retrained successfully.')
    } catch (error) {
      setMessage(`Retraining failed: ${error.message}`)
    } finally {
      setTraining(false)
    }
  }

  if (loading) return <SkeletonPage />
  if (!loading && message.startsWith('Unable to load settings:')) {
    return <ErrorState message={message.replace('Unable to load settings: ', '')} onRetry={() => location.reload()} />
  }

  return <div className="settings-page"><div className="page-header"><h3>Settings</h3><p>Great Zimbabwe University InfraSight configuration</p></div>{message && <div className="toast">{message}</div>}<section className="panel"><h4>Threshold Settings</h4><div className="grid"><Field label="CPU Warning Threshold (%)" value={thresholds.cpuWarning} onChange={value => update('cpuWarning', value)} /><Field label="Memory Warning Threshold (%)" value={thresholds.memoryWarning} onChange={value => update('memoryWarning', value)} /><Field label="Packet Loss Warning Threshold (%)" value={thresholds.packetLossWarning} onChange={value => update('packetLossWarning', value)} /><Field label="Latency Warning Threshold (ms)" value={thresholds.latencyWarning} onChange={value => update('latencyWarning', value)} /><Field label="Interface Error Warning Threshold" value={thresholds.interfaceErrorWarning} onChange={value => update('interfaceErrorWarning', value)} /><Field label="Uptime Critical Threshold (%)" value={thresholds.uptimeCritical} onChange={value => update('uptimeCritical', value)} /></div><button onClick={save}>Save Changes</button></section><section className="panel"><h4>Polling Settings</h4><Field label="Polling Interval (seconds)" value={thresholds.pollingInterval} onChange={value => update('pollingInterval', value)} /><button onClick={save}>Save Changes</button></section><section className="panel"><h4>Model Settings</h4><div className="info-grid"><Info label="Model Version" value={modelInfo?.model_version || 'rf-v1'} /><Info label="Accuracy" value={`${((modelInfo?.metrics?.accuracy || 0) * 100).toFixed(1)}%`} /><Info label="Training Samples" value={(modelInfo?.metrics?.n_train_samples || 0) + (modelInfo?.metrics?.n_test_samples || 0)} /><Info label="Training Date" value="Saved model artifact" /></div><button onClick={retrain} disabled={training}>{training ? 'Retraining...' : 'Retrain Model'}</button></section><section className="panel"><h4>System Info</h4><div className="info-grid"><Info label="Firebase Project ID" value={systemInfo?.project_id || 'infrasight-gzu'} /><Info label="Backend Version" value="1.0.0" /><Info label="Frontend Version" value="1.0.0" /><Info label="Environment Mode" value={systemInfo?.datastore_mode || 'unknown'} /></div></section><style>{styles}</style></div>
}

function Field({ label, value, onChange }) { return <label><span>{label}</span><input type="number" value={value} onChange={event => onChange(event.target.value)} /></label> }
function Info({ label, value }) { return <div className="info"><span>{label}</span><strong>{value}</strong></div> }

const styles = `.spinner{text-align:center;padding:50px}.page-header{margin-bottom:24px}.page-header h3{font-size:26px;margin:0;color:#111827}.page-header p{color:#6b7280}.panel{background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:22px;margin-bottom:18px}.grid,.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}label span,.info span{display:block;color:#6b7280;font-size:13px;margin-bottom:6px}input{width:100%;padding:11px;border:1px solid #d1d5db;border-radius:10px}button{margin-top:16px;background:#16a34a;color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}button:disabled{opacity:.6}.info{background:#f9fafb;border-radius:12px;padding:16px}.info strong{font-size:18px;color:#111827}.toast{background:#dcfce7;color:#166534;padding:12px 16px;border-radius:10px;margin-bottom:16px}`
