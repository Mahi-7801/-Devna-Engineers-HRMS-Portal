import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, User, MessageSquare, ThumbsUp } from 'lucide-react'
import { getApprovals, updateApproval } from '../../lib/db'

function ApprovalsCenter() {
  const [tab, setTab] = useState('pending')
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getApprovals()
      .then(data => { setApprovals(data); setLoading(false) })
      .catch(err => { console.error('Failed to load approvals:', err); setLoading(false) })
  }, [])

  const filtered = tab === 'pending' ? approvals.filter(a => a.status === 'Pending') : approvals

  const handleAction = async (id, status) => {
    try {
      const updated = await updateApproval(id, { status, action: status === 'Approved' ? 'Approved' : 'Rejected' })
      setApprovals(prev => prev.map(a => a.id === id ? updated : a))
    } catch (err) {
      console.error(err)
      alert('Failed to update approval')
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Approvals Center</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review and manage pending requests, workflows, and decisions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: approvals.filter(a => a.status === 'Pending').length, color: '#4CAF50', icon: Clock },
          { label: 'Approved Today', value: approvals.filter(a => a.status === 'Approved').length, color: '#4CAF50', icon: CheckCircle },
          { label: 'Rejected Today', value: approvals.filter(a => a.status === 'Rejected').length, color: '#1A78C2', icon: XCircle },
          { label: 'Avg Response', value: '—', color: '#1A78C2', icon: ThumbsUp },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="text-xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {['pending', 'all'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="tab-btn text-sm capitalize" data-active={tab === t}>
              {t === 'all' ? 'All Requests' : 'Pending Review'}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header">{['Type', 'Requester', 'Action', 'Date', 'Priority', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3"><span className="badge">{a.type}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /><span style={{ color: 'var(--text-primary)' }}>{a.requester}</span></div></td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.action}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{a.date}</td>
                  <td className="px-4 py-3"><span className={`badge ${a.priority === 'High' ? 'badge-danger' : a.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{a.priority}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${a.status === 'Approved' ? 'badge-success' : a.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    {a.status === 'Pending' ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleAction(a.id, 'Approved')} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: '#4CAF50' }}><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleAction(a.id, 'Rejected')} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: '#1A78C2' }}><XCircle className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ApprovalsCenter
