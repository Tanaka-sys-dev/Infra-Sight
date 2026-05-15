import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import { DemoProvider } from './contexts/DemoContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import DeviceDetail from './pages/DeviceDetail'
import Alerts from './pages/Alerts'
import Predictions from './pages/Predictions'
import Scenarios from './pages/Scenarios'
import Evaluation from './pages/Evaluation'
import Telemetry from './pages/Telemetry'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><Layout><Devices /></Layout></ProtectedRoute>} />
          <Route path="/devices/:deviceId" element={<ProtectedRoute><Layout><DeviceDetail /></Layout></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
          <Route path="/predictions" element={<ProtectedRoute><Layout><Predictions /></Layout></ProtectedRoute>} />
          <Route path="/scenarios" element={<ProtectedRoute><Layout><Scenarios /></Layout></ProtectedRoute>} />
          <Route path="/evaluation" element={<ProtectedRoute><Layout><Evaluation /></Layout></ProtectedRoute>} />
          <Route path="/telemetry" element={<ProtectedRoute><Layout><Telemetry /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          </Routes>
        </Router>
      </DemoProvider>
    </AuthProvider>
  )
}

export default App
