import { useState, useEffect } from 'react'
import { User, Calendar, Clock, FileText, CreditCard, Shield, ChevronRight, MapPin, Phone, Mail } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getEmployees, getTodayAttendance } from '../../lib/db'

function SelfService() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [empData, setEmpData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getEmployees()
      .then(emps => {
        const found = emps.find(e => e.email?.toLowerCase() === user.email?.toLowerCase())
        setEmpData(found || null)
        setLoading(false)
      })
      .catch(err => { console.error('Failed to load employee data:', err); setLoading(false) })
  }, [user])

  const tabs = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'payslips', label: 'Payslips', icon: FileText },
    { key: 'documents', label: 'Documents', icon: Shield },
  ]

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Self Service</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View and manage your personal information, attendance, payslips, and documents.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="tab-btn text-sm" data-active={activeTab === t.key}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
              {empData && empData.name ? empData.name.split(' ').map(n => n[0]).join('') : 'NA'}
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{empData?.name || 'N/A'}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {[empData?.designation, empData?.dept].filter(Boolean).join(' — ') || 'N/A'}
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-left">
              {[
                { icon: Mail, label: empData?.email || '--' },
                { icon: Phone, label: empData?.phone || '--' },
                { icon: MapPin, label: empData?.address || '--' },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-2.5"><d.icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /><span style={{ color: 'var(--text-secondary)' }}>{d.label}</span></div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 card p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Full Name', value: empData?.name || 'N/A' },
                  { label: 'Date of Birth', value: empData?.dob || '--' },
                  { label: 'Gender', value: empData?.gender || '--' },
                  { label: 'Marital Status', value: empData?.marital_status || '--' },
                  { label: 'Blood Group', value: empData?.blood_group || '--' },
                  { label: 'PAN', value: empData?.pan || '--' },
                ].map((f, i) => (
                  <div key={i}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                    <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Email', value: empData?.email || '--' },
                  { label: 'Phone', value: empData?.phone || '--' },
                  { label: 'Emergency Contact', value: empData?.emergency_contact || '--' },
                  { label: 'Address', value: empData?.address || '--' },
                ].map((f, i) => (
                  <div key={i}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                    <div className="font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card p-6 text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Attendance data coming soon</p>
          <p className="text-xs mt-1">Check the attendance section for your daily logs.</p>
        </div>
      )}

      {activeTab === 'payslips' && (
        <div className="card p-6 text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No payslips available</p>
          <p className="text-xs mt-1">Payslips will appear once payroll is processed.</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card p-6 text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No documents available</p>
          <p className="text-xs mt-1">Documents will appear here once uploaded.</p>
        </div>
      )}
    </div>
  )
}

export default SelfService
