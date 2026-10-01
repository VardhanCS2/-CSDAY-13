import { useEffect, useState } from 'react'
import { api, responseData } from '@/api/client'
import { AuthContext } from '@/context/auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('access_token')))
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const expireSession = () => {
      setToken(null)
      setUser(null)
      setCartCount(0)
      setLoading(false)
    }
    window.addEventListener('session-expired', expireSession)
    return () => window.removeEventListener('session-expired', expireSession)
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true

    api.get('/auth/me')
      .then((response) => {
        if (active) setUser(responseData(response))
        return api.get('/cart/')
      })
      .then((response) => {
        if (active) setCartCount((responseData(response) || []).reduce((sum, item) => sum + item.quantity, 0))
      })
      .catch(() => {
        if (active && !localStorage.getItem('access_token')) setUser(null)
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [token])

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const session = responseData(response)
    localStorage.setItem('access_token', session.access_token)
    localStorage.setItem('refresh_token', session.refresh_token)
    setToken(session.access_token)
    const profile = await api.get('/auth/me')
    setUser(responseData(profile))
    return responseData(profile)
  }

  async function register(name, email, password) {
    await api.post('/auth/register', { name, email, password })
    return login(email, password)
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    setCartCount(0)
  }

  async function refreshCartCount() {
    if (!localStorage.getItem('access_token')) return
    const response = await api.get('/cart/')
    setCartCount((responseData(response) || []).reduce((sum, item) => sum + item.quantity, 0))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, cartCount, login, register, logout, refreshCartCount }}>
      {children}
    </AuthContext.Provider>
  )
}
