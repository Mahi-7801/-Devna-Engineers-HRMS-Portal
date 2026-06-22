import { useState, useEffect, useRef } from 'react'
import { Building2, DollarSign, FileText, Package, Shield, Bell, Activity, Save, Clock, User, Info, AlertTriangle, CheckCheck, Search } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getDepartments, getCompanySettings, upsertCompanySettings, getAllNotifications, markNotificationRead, subscribeToTable, getAuditLogs } from '../../lib/db'

function Settings() {
  const { role } = useTheme()
  const [activeSection, setActiveSection] = useState('company')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    registration_no: '',
    gst_no: '',
    pan: '',
    email: '',
    phone: '',
    industry: '',
    address: ''
  })

  useEffect(() => {
    getDepartments()
      .then(data => setDepartments(data))
      .catch(err => console.error('Failed to load departments:', err))

    getCompanySettings()
      .then(data => {
        if (data && data.company_name) {
          setForm({
            company_name: data.company_name || '',
            registration_no: data.registration_no || '',
            gst_no: data.gst_no || '',
            pan: data.pan || '',
            email: data.email || '',
            phone: data.phone || '',
            industry: data.industry || '',
            address: data.address || ''
          })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load company settings:', err)
        setLoading(false)
      })
  }, [])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertCompanySettings(form)
      alert('Company settings saved successfully')
    } catch (err) {
      console.error('Failed to save company settings:', err)
      alert('Failed to save company settings')
    }
    setSaving(false)
  }

  const sections = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'payroll', label: 'Payroll Rules', icon: DollarSign, roleLimit: 'super_admin' },
    { key: 'leave', label: 'Leave Policies', icon: FileText },
    { key: 'roles', label: 'Roles & Permissions', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'audit', label: 'Audit Logs', icon: Activity },
  ]

  const visibleSections = sections.filter(s => !s.roleLimit || role === s.roleLimit)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings & Administration</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Company configuration, payroll rules, leave policies, and system settings.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {visibleSections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className="tab-btn text-sm" data-active={activeSection === s.key}>
            <s.icon className="w-4 h-4" /> {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'company' && (
        <div className="card p-6 space-y-5">
          {loading ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading company settings...</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{form.company_name || 'Company'}</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{departments.length} departments · {form.industry || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Company Name</label>
                  <input type="text" className="input-field" value={form.company_name} onChange={handleChange('company_name')} placeholder="e.g. Devna Engineers" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Registration No</label>
                  <input type="text" className="input-field" value={form.registration_no} onChange={handleChange('registration_no')} placeholder="e.g. U12345MH2020" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>GST No</label>
                  <input type="text" className="input-field" value={form.gst_no} onChange={handleChange('gst_no')} placeholder="e.g. 27AABCU9603R1ZX" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>PAN</label>
                  <input type="text" className="input-field" value={form.pan} onChange={handleChange('pan')} placeholder="e.g. AABCD1234E" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={handleChange('email')} placeholder="e.g. info@devna.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Phone</label>
                  <input type="text" className="input-field" value={form.phone} onChange={handleChange('phone')} placeholder="e.g. +91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Industry</label>
                  <input type="text" className="input-field" value={form.industry} onChange={handleChange('industry')} placeholder="e.g. Engineering / Manufacturing" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Employees</label>
                  <input type="number" className="input-field" value={departments.length} disabled />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Address</label>
                <textarea className="input-field" rows="2" value={form.address} onChange={handleChange('address')} placeholder="Enter company address" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeSection === 'payroll' && role === 'super_admin' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payroll Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {[
              { label: 'PF Employer Contribution (%)', value: '' },
              { label: 'ESIC Employer Contribution (%)', value: '' },
              { label: 'Professional Tax (Monthly)', value: '' },
              { label: 'OT Rate Multiplier', value: '' },
              { label: 'Bonus % of Basic (Annual)', value: '' },
              { label: 'Payroll Cycle', value: '' },
            ].map((f, i) => (
              <div key={i}>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                <input className="input-field" defaultValue={f.value} placeholder="Not configured" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { label: 'PF Applicable' },
              { label: 'ESIC Applicable' },
              { label: 'TDS Deduction' },
            ].map((t, i) => (
              <label key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                <input type="checkbox" className="accent-primary w-4 h-4" /> {t.label}
              </label>
            ))}
          </div>
          <div className="flex justify-end"><button onClick={() => alert('Payroll rules saved (placeholder)')} className="btn-primary"><Save className="w-4 h-4" /> Save Changes</button></div>
        </div>
      )}

      {activeSection === 'leave' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Leave Policies</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Leave policies not configured</p>
        </div>
      )}

      {activeSection === 'roles' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Roles & Permissions</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No roles configured</p>
        </div>
      )}

      {activeSection === 'notifications' && <NotificationPanel />}

      {activeSection === 'audit' && <AuditLogPanel />}
    </div>
  )
}

const notifPrefs = [
  { key: 'email', label: 'Email Notifications', desc: 'Receive email alerts for pending approvals and updates' },
  { key: 'leave', label: 'Leave Approvals', desc: 'Notify when employee applies for leave' },
  { key: 'shift', label: 'Shift Allocation', desc: 'Alert when new shifts are allocated' },
  { key: 'asset', label: 'Asset Allocation', desc: 'Notify on new asset allocation requests' },
  { key: 'system', label: 'System Alerts', desc: 'Critical system notifications and warnings' },
]

function NotificationPanel() {
  const [notifications, setNotifications] = useState([])
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('notif_prefs')
    return saved ? JSON.parse(saved) : Object.fromEntries(notifPrefs.map(p => [p.key, true]))
  })
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  const togglePref = (key) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('notif_prefs', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    getAllNotifications()
      .then(data => { setNotifications(data); setLoading(false) })
      .catch(err => { console.error('Failed to load notifications:', err); setLoading(false) })

    channelRef.current = subscribeToTable('notifications', (payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev])
      }
      if (payload.eventType === 'UPDATE') {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n))
      }
    })

    return () => {
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (title) => {
    const t = (title || '').toLowerCase()
    if (t.includes('leave')) return FileText
    if (t.includes('asset') || t.includes('allocation')) return Package
    if (t.includes('shift')) return Clock
    if (t.includes('payroll') || t.includes('salary')) return DollarSign
    if (t.includes('employee') || t.includes('onboard')) return User
    if (t.includes('alert') || t.includes('warning')) return AlertTriangle
    return Info
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading notifications...
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>System Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{notifications.length} total</span>
      </div>

      <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Notification Preferences</div>
        {notifPrefs.map(p => (
          <label key={p.key} className="flex items-center justify-between py-1.5 cursor-pointer">
            <div>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{p.label}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.desc}</div>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${prefs[p.key] ? 'bg-primary' : ''}`} style={{ background: prefs[p.key] ? 'var(--color-primary)' : 'var(--border)' }}
              onClick={() => togglePref(p.key)}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${prefs[p.key] ? 'translate-x-4' : ''}`} />
            </div>
          </label>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="p-10 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Notifications will appear here as system events occur</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {notifications.map(n => {
            const Icon = getIcon(n.title)
            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${!n.read ? '' : ''}`}
                style={!n.read ? { background: 'color-mix(in srgb, var(--color-primary) 4%, transparent)' } : {}}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => { if (!n.read) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 4%, transparent)'; else e.currentTarget.style.background = 'transparent' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: !n.read ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--hover)' }}>
                  <Icon className="w-4 h-4" style={{ color: !n.read ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{n.title || 'Notification'}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-primary)' }} />}
                  </div>
                  {n.message && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{formatTime(n.created_at)}</span>
                    {n.user_id && (
                      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                        <User className="w-2.5 h-2.5" /> {n.user_id.startsWith('emp_') ? 'Employee' : 'Admin'}
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 rounded-lg transition-colors shrink-0 mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--color-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    title="Mark as read">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="px-4 py-3 text-xs text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {unreadCount > 0 ? `${unreadCount} unread · ` : ''}Real-time updates active
          <span className="inline-block w-1.5 h-1.5 rounded-full ml-1 animate-pulse" style={{ background: '#4CAF50' }} />
        </div>
      )}
    </div>
  )
}

function AuditLogPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const channelRef = useRef(null)

  useEffect(() => {
    getAuditLogs()
      .then(data => { setLogs(data); setLoading(false) })
      .catch(err => { console.error('Failed to load audit logs:', err); setLoading(false) })

    channelRef.current = subscribeToTable('audit_logs', (payload) => {
      if (payload.eventType === 'INSERT') {
        setLogs(prev => [payload.new, ...prev])
      }
    })

    return () => {
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [])

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getActionColor = (action) => {
    const a = (action || '').toLowerCase()
    if (a.includes('create') || a.includes('onboard') || a.includes('add')) return '#4CAF50'
    if (a.includes('update') || a.includes('edit') || a.includes('change')) return '#1A78C2'
    if (a.includes('delete') || a.includes('remove') || a.includes('exit')) return '#f87171'
    if (a.includes('process') || a.includes('approve') || a.includes('pay')) return '#f59e0b'
    return 'var(--text-muted)'
  }

  const filteredLogs = searchTerm
    ? logs.filter(l =>
        (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.table_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.performed_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.details || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs

  if (loading) {
    return (
      <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading audit logs...
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Audit Logs</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-1.5 text-xs" style={{ minWidth: '160px' }} />
          </div>
          <span className="text-xs whitespace-nowrap shrink-0" style={{ color: 'var(--text-muted)' }}>{filteredLogs.length} / {logs.length} entries</span>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center">
          <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{searchTerm ? 'No matching audit logs' : 'No audit logs yet'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{searchTerm ? 'Try a different search term' : 'System actions will be recorded here automatically'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th>Action</th>
                <th>Table</th>
                <th>Performed By</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                      style={{ background: `color-mix(in srgb, ${getActionColor(log.action)} 12%, transparent)`, color: getActionColor(log.action) }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{log.table_name || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{log.performed_by || '—'}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }} title={log.details}>{log.details || '—'}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{formatTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length > 0 && (
        <div className="px-4 py-3 text-xs text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Live tracking active
          <span className="inline-block w-1.5 h-1.5 rounded-full ml-1 animate-pulse" style={{ background: '#4CAF50' }} />
        </div>
      )}
    </div>
  )
}

export default Settings
