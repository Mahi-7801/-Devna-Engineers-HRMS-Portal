import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useTheme } from '../../lib/ThemeContext'
import { getNotifications, markNotificationRead } from '../../lib/db'
import { useRealtime } from '../../lib/useRealtime'
import {
  Bell, Menu, Search, LogOut, User, ChevronDown, Settings,
  Sun, Moon, PanelLeftClose, PanelLeft, HelpCircle, HardHat
} from 'lucide-react'

function Header({ onMenuToggle, onCollapseToggle }) {
  const { user, logout } = useAuth()
  const { dark, toggleDark, sidebarCollapsed, role, switchRole, ROLES } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      getNotifications(user.id).then(setNotifications).catch(err => console.error('Failed to load notifications:', err))
    }
  }, [user?.id])

  useRealtime('notifications', (payload) => {
    if (payload.new && user?.id) {
      if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20))
      }
      if (payload.eventType === 'UPDATE') {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
      }
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotifClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id).catch(err => console.error('Failed to mark notification read:', err))
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shrink-0 transition-colors duration-200"
      style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={onCollapseToggle} className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
        <div className="hidden md:flex items-center gap-2.5 mr-2" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
          </div>
          <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Devna Engineers</div>
        </div>
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search employees, reports..."
            className="pl-10 pr-4 py-2 rounded-xl text-sm w-72 outline-none transition-all"
            style={{ background: 'var(--hover)', border: '1px solid transparent', color: 'var(--text-primary)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'transparent'} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleDark} className="p-2.5 rounded-xl transition-colors hidden sm:flex" style={{ color: 'var(--text-muted)' }}>
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="absolute -right-12 sm:right-0 top-full mt-2 w-[280px] sm:w-80 rounded-2xl shadow-lg border z-50 overflow-hidden animate-scale-in"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</div>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No notifications yet
                </div>
              ) : notifications.slice(0, 5).map((n, i) => (
                <div key={n.id || i} onClick={() => handleNotifClick(n)}
                  className="px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)', opacity: n.read ? 0.6 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Just now'}
                    {!n.read && <span className="ml-2 w-1.5 h-1.5 bg-primary rounded-full inline-block" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-3 py-1.5 rounded-xl transition-colors"
            style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.avatar || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ROLES[role]?.label || 'Staff'}</div>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-lg border z-50 py-1.5 animate-scale-in"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email || 'user@devna.com'}</div>
              </div>
              <button onClick={() => { setDropdownOpen(false); navigate('/app/settings') }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button onClick={() => { setDropdownOpen(false); handleLogout() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
