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
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>InfraSight</h1>
          <p>ICT Infrastructure Monitoring</p>
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
          <div className="topbar-actions"><button onClick={toggleDemoMode}>{isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}</button><span>Great Zimbabwe University</span></div>
        </header>
        {isDemoMode && <div className="demo-banner">DEMO MODE - Great Zimbabwe University Examination</div>}
        <div className="content">
          {children}
        </div>
        {isDemoMode && <aside className="demo-guide"><h4>Examiner Guide</h4><strong>Key features</strong><p>Dashboard KPIs, live device telemetry, Random Forest predictions, alerts, scenario validation, evaluation export.</p><strong>5 minute click sequence</strong><p>Dashboard → Devices → sw-001 → Predictions → Alerts → Scenarios → Evaluation → Export PDF.</p></aside>}
      </main>
      <style>{`
        .app {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 250px;
          background: #1a1a2e;
          color: white;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .sidebar-header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .sidebar-header p {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 30px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .nav-item {
          padding: 12px 15px;
          color: #a0a0b0;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: #16213e;
          color: white;
        }
        .nav-item.active {
          background: #0f3460;
          color: white;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          background: white;
          padding: 20px 30px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .topbar h2 {
          font-size: 24px;
          color: #333;
        }
        .topbar span { color: #16a34a; font-weight: 700; }
        .topbar-actions { display: flex; gap: 14px; align-items: center; }
        .topbar-actions button { background: #16a34a; color: white; border: 0; border-radius: 10px; padding: 9px 12px; font-weight: 800; cursor: pointer; }
        .demo-banner { background: #fef3c7; color: #92400e; padding: 12px 30px; font-weight: 900; border-bottom: 1px solid #f59e0b; }
        .demo-guide { position: fixed; right: 22px; bottom: 22px; width: 280px; background: #111827; color: white; padding: 18px; border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,.3); z-index: 20; }
        .demo-guide h4 { margin: 0 0 10px; color: #fbbf24; }
        .demo-guide strong { color: #86efac; }
        .demo-guide p { font-size: 12px; line-height: 1.5; color: #e5e7eb; }
        .content {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
