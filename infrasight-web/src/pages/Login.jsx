import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Login() {
  const { user, login, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('researcher@infrasight.local')
  const [password, setPassword] = useState('infrasight-demo')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>InfraSight</h1>
        <p>Sign in to monitor ICT infrastructure health and predictive maintenance signals.</p>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button disabled={submitting} type="submit">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
          padding: 24px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-card h1 {
          color: #1a1a2e;
          font-size: 32px;
        }
        .login-card p {
          color: #666;
          line-height: 1.5;
        }
        .login-card label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #333;
          font-weight: 600;
        }
        .login-card input {
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          padding: 12px;
          font: inherit;
        }
        .login-card button {
          border: 0;
          border-radius: 8px;
          padding: 12px;
          background: #0f3460;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        .login-card button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .error-box {
          background: #f8d7da;
          color: #721c24;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
