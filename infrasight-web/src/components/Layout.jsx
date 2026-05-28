import { Link, useLocation } from 'react-router-dom'
import { useDemoMode } from '../contexts/DemoContext'

export default function Layout({ children }) {
  const location = useLocation()
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/devices', label: 'Devices' },
    { path: '/alerts', label: 'Alerts' },
    { path: '/predictions', label: 'Predictions' },
    { path: '/scenarios', label: 'Scenarios' },
    { path: '/evaluation', label: 'Evaluation' },
    { path: '/telemetry', label: 'Telemetry' },
    { path: '/settings', label: 'Settings' },
    { path: '/infrastructure', label: 'Infrastructure' },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>InfraSight</h1>
          <p>Predictive ICT Fault Monitoring</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h2>{navItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || 'Dashboard'}</h2>
          <div className="topbar-actions"><button onClick={toggleDemoMode}>{isDemoMode ? 'Exit Presentation Mode' : 'Presentation Mode'}</button><span>Great Zimbabwe University</span></div>
        </header>
        {isDemoMode && <div className="demo-banner">PRESENTATION MODE - Great Zimbabwe University Examination Dataset</div>}
        <div className="content">
          {children}
        </div>
        {isDemoMode && <aside className="demo-guide"><h4>Presentation Guide</h4><strong>Monitoring workflow</strong><p>Telemetry windows feed the Random Forest model; fault-prone predictions create actionable alerts.</p><strong>5 minute sequence</strong><p>Dashboard → Devices → SRV-001 → Predictions → Alerts → Scenarios → Evaluation → Export PDF.</p></aside>}
      </main>
    </div>
  )
}
