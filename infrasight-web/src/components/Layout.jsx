import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()

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
          <span>Great Zimbabwe University</span>
        </header>
        <div className="content">
          {children}
        </div>
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
        .content {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
