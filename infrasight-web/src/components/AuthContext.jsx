import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginWithEmail, logoutUser, subscribeToAuthState } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    setError(null)
    try {
      const authenticatedUser = await loginWithEmail(email, password)
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (err) {
      setError(err.message || 'Unable to sign in')
      throw err
    }
  }

  async function logout() {
    await logoutUser()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, error, login, logout }), [user, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
