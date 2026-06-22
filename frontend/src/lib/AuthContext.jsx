import { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTheme } from './ThemeContext'
import supabase from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { switchRole } = useTheme()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devna_user')
    return saved ? JSON.parse(saved) : null
  })
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const userData = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          role: session.user.user_metadata?.role || 'hr_manager',
          avatar: session.user.user_metadata?.avatar || session.user.email?.charAt(0).toUpperCase(),
          id: session.user.id
        }
        setUser(userData)
        localStorage.setItem('devna_user', JSON.stringify(userData))
        localStorage.setItem('devna_role', userData.role)
        switchRole(userData.role)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        const userData = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          role: session.user.user_metadata?.role || 'hr_manager',
          avatar: session.user.user_metadata?.avatar || session.user.email?.charAt(0).toUpperCase(),
          id: session.user.id
        }
        setUser(userData)
        localStorage.setItem('devna_user', JSON.stringify(userData))
        localStorage.setItem('devna_role', userData.role)
        switchRole(userData.role)
      } else {
        setUser(null)
        localStorage.removeItem('devna_user')
        localStorage.removeItem('devna_role')
      }
    })

    return () => subscription.unsubscribe()
  }, [switchRole])

  useEffect(() => {
    if (user && user.role) {
      switchRole(user.role)
    }
  }, [user, switchRole])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password' }
      }
      return { error: error.message }
    }
    if (data?.user) {
      const userData = {
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: data.user.email,
        role: data.user.user_metadata?.role || 'hr_manager',
        avatar: data.user.user_metadata?.avatar || email.charAt(0).toUpperCase(),
        id: data.user.id
      }
      localStorage.setItem('devna_user', JSON.stringify(userData))
      localStorage.setItem('devna_role', userData.role)
      setUser(userData)
      switchRole(userData.role)
      return { error: null, role: userData.role }
    }
    return { error: 'Login failed' }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('devna_user')
    localStorage.removeItem('devna_role')
    localStorage.removeItem('devna_super_session')
    setUser(null)
    setSession(null)
    switchRole('super_admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, session }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
