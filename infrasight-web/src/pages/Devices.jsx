import { Link } from 'react-router-dom'
import { devicesAPI } from '../services/api'
import { useApiData } from '../services/useApiData'

export default function Devices() {
  const { data: devices, loading, error } = useApiData(devicesAPI.getAll, 'devices')

  if (loading) return <div className="loading">Loading devices...</div>
  if (error) return <div className="error-box">Unable to load devices: {error}</div>

  return (
    <div className="devices-page">
      <div className="page-header"><h3>Devices</h3><p className="page-subtitle">Monitor and manage your infrastructure devices</p></div>
      <div className="table-container"><table className="data-table"><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>Location</th><th>Action</th></tr></thead><tbody>{devices.map(device => <tr key={device.id} className="click-row"><td>{device.id}</td><td><Link to={`/devices/${device.id}`}>{device.name}</Link></td><td>{device.type}</td><td><span className={`status status-${device.status}`}>{device.status}</span></td><td>{device.location || '-'}</td><td><Link className="view-button" to={`/devices/${device.id}`}>View Details</Link></td></tr>)}</tbody></table></div>
      <style>{`.loading{text-align:center;padding:40px;color:#666}.error-box{background:#f8d7da;color:#721c24;padding:16px;border-radius:8px}.page-header{margin-bottom:24px}.page-header h3{font-size:24px;margin-bottom:8px;color:#333}.page-subtitle{color:#666;font-size:14px}.table-container{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow-x:auto}.data-table{width:100%;border-collapse:collapse}.data-table th{text-align:left;padding:16px;font-size:13px;color:#666;border-bottom:2px solid #f0f0f0;font-weight:600}.data-table td{padding:16px;font-size:14px;border-bottom:1px solid #f0f0f0}.click-row:hover{background:#f8fafc}.status,.view-button{display:inline-block;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:500}.status-online{background:#d4edda;color:#155724}.status-warning{background:#fff3cd;color:#856404}.status-offline{background:#f8d7da;color:#721c24}.view-button{background:#dbeafe;color:#1e40af;text-decoration:none}`}</style>
    </div>
  )
}
