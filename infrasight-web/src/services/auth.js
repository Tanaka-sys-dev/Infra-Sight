import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'

const MOCK_AUTH_ENABLED = import.meta.env.VITE_MOCK_AUTH !== 'false'

export function subscribeToAuthState(callback) {
  if (MOCK_AUTH_ENABLED) {
    const storedUser = localStorage.getItem('infrasight-user')
    callback(storedUser ? JSON.parse(storedUser) : null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function loginWithEmail(email, password) {
  if (MOCK_AUTH_ENABLED) {
    const user = {
      uid: 'mock-user-001',
      email,
      displayName: 'InfraSight Analyst',
      accessToken: 'mock-token',
    }
    localStorage.setItem('infrasight-user', JSON.stringify(user))
    return user
  }

  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function logoutUser() {
  if (MOCK_AUTH_ENABLED) {
    localStorage.removeItem('infrasight-user')
    return
  }

  await signOut(auth)
}
