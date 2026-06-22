import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/ThemeContext'
import { Search, CheckCircle, XCircle, CalendarCheck, Clock, AlertCircle, Plus, Filter } from 'lucide-react'
import { getLeaveRequests, updateLeaveRequest, getAllLeaveBalances } from '../../lib/db'

function LeaveManagement() {
  const navigate = useNavigate()
  const { role } = useTheme()
  const isAdmin = role === 'super_admin' || role === 'hr_manager' || role === 'dept_manager'
  const [tab, setTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [leaveRequests, setLeaveRequests] = useState([])
  const [balanceData, setBalanceData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [data, balances] = await Promise.all([
        getLeaveRequests(),
        getAllLeaveBalances().catch(() => []),
      ])
      setLeaveRequests(data || [])
      const grouped = (balances || []).reduce((acc, b) => {
        const existing = acc.find(a => a.type === b.leave_type)
        if (existing) {
          existing.total += b.total || 0
          existing.used += b.used || 0
          existing.remaining += b.remaining || 0
        } else {
          acc.push({
            type: b.leave_type === 'Annual' ? 'Annual Leave' : b.leave_type === 'Sick' ? 'Sick Leave' : b.leave_type === 'Casual' ? 'Casual Leave' : b.leave_type,
            total: b.total || 0,
            used: b.used || 0,
            remaining: b.remaining || 0,
            icon: b.leave_type === 'Annual' || b.leave_type === 'Annual Leave' ? CalendarCheck : b.leave_type === 'Sick' || b.leave_type === 'Sick Leave' ? AlertCircle : Clock,
            color: b.leave_type === 'Annual' || b.leave_type === 'Annual Leave' ? '#1A78C2' : b.leave_type === 'Sick' || b.leave_type === 'Sick Leave' ? '#4CAF50' : '#1A78C2',
          })
        }
        return acc
      }, [])
      setBalanceData(grouped)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await updateLeaveRequest(id, { status: 'Approved' })
      setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r))
    } catch (err) {
      console.error(err)
      alert('Failed to approve leave request')
    }
  }

  const handleReject = async (id) => {
    try {
      await updateLeaveRequest(id, { status: 'Rejected' })
      setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r))
    } catch (err) {
      console.error(err)
      alert('Failed to reject leave request')
    }
  }

  const filtered = leaveRequests.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || r.id?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Leave Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage leave requests, approvals, and balances.</p>
        </div>
        <button onClick={() => navigate('/app/attendance/leave/request')} className="btn-primary text-xs"><Plus className="w-4 h-4" /> New Request</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('requests')} className={`tab-btn ${tab === 'requests' ? 'active' : ''}`}>Leave Requests</button>
        <button onClick={() => setTab('balance')} className={`tab-btn ${tab === 'balance' ? 'active' : ''}`}>Leave Balance</button>
      </div>

      {tab === 'requests' && (
        <div className="card overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search employee or ID..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : ''}`}
                  style={statusFilter !== s ? { background: 'var(--hover)', color: 'var(--text-secondary)' } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-header">{['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((lv, i) => (
                  <tr key={lv.id || i} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {lv.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{lv.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge-neutral badge">{lv.leave_type || lv.type}</span></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{lv.from} - {lv.to}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{lv.days}</td>
                    <td className="px-4 py-3 max-w-[100px] sm:max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{lv.reason}</td>
                    <td className="px-4 py-3"><span className={`badge ${lv.status === 'Approved' ? 'badge-success' : lv.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{lv.status}</span></td>
                    <td className="px-4 py-3">
                      {lv.status === 'Pending' && isAdmin ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleApprove(lv.id)} className="p-1.5 rounded-lg transition-colors hover:bg-green-50" style={{ color: '#4CAF50' }} title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReject(lv.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: '#1A78C2' }} title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lv.status === 'Approved' ? 'Approved' : lv.status === 'Rejected' ? 'Rejected' : 'Awaiting'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {balanceData.length > 0 ? balanceData.map((b, i) => {
            const Icon = b.icon
            return (
              <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${b.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: b.color }} />
                  </div>
                  <span className={`badge ${b.remaining > 5 ? 'badge-success' : 'badge-warning'}`}>{b.remaining} left</span>
                </div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.type}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    { label: 'Total', value: b.total, color: 'var(--text-primary)' },
                    { label: 'Used', value: b.used, color: '#4CAF50' },
                    { label: 'Remaining', value: b.remaining, color: '#4CAF50' },
                  ].map((s, j) => (
                    <div key={j} className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                      <span className="font-medium" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(b.used / b.total) * 100}%`, background: b.color }} />
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No leave balances found</p>
              <p className="text-xs mt-1">Leave balances will appear once data is configured.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LeaveManagement
