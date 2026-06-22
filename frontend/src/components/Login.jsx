import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/ThemeContext'
import { HardHat, Eye, EyeOff, Sun, Moon } from 'lucide-react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { dark, toggleDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/app/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      const target = result?.role === 'employee' ? '/employee' : from
      navigate(target, { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex transition-colors duration-200"
      style={{ background: dark ? 'var(--bg)' : 'linear-gradient(135deg, #E3F0FA 0%, #ffffff 50%, #E8F5E9 100%)' }}>
      <button onClick={toggleDark} className="fixed top-4 right-4 z-50 p-2.5 rounded-xl transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0D4F7A 0%, #1A78C2 50%, #4CAF50 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 -left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <HardHat className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Devna Engineers</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">Enterprise HRMS — Managing workforce, attendance, payroll, and assets for engineering excellence.</p>
          <div className="mt-12">
            <p className="text-white/70 text-sm">Welcome to the HRMS portal. Sign in with your credentials to continue.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-lg">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Access your Devna Engineers HRMS account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
                style={{ background: dark ? '#0D1B3E' : 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', color: dark ? 'var(--color-primary)' : 'var(--color-primary-dark)' }}>
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <p>Use Supabase Auth credentials to sign in</p>
              <p className="leading-relaxed">
                Create users in Supabase Auth dashboard with email/password
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
