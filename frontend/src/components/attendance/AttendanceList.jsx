import { useState, useEffect } from 'react'
import { Search, CalendarDays, Download } from 'lucide-react'
import { getAttendance, subscribeToTable } from '../../lib/db'

function AttendanceList() {
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayFilter, setTodayFilter] = useState(false)

  useEffect(() => {
    loadData()
    const sub = subscribeToTable('attendance', () => { loadData() })
    return () => { sub.unsubscribe() }
  }, [])

  const loadData = async () => {
    try {
      const data = await getAttendance()
      setLogs(data.map(r => ({
        date: r.date,
        name: r.employees?.name || 'Unknown',
        id: r.employees?.employee_id || r.employee_id,
        dept: r.employees?.department || '',
        in: r.check_in ? r.check_in.slice(0, 5) : '--',
        out: r.check_out ? r.check_out.slice(0, 5) : '--',
        status: r.status || 'Absent',
        ot: r.overtime_minutes ? `${Math.floor(r.overtime_minutes / 60)}h ${r.overtime_minutes % 60}m` : '--'
      })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const total = logs.length || 1
  const present = logs.filter(l => l.status === 'Present').length
  const absent = logs.filter(l => l.status === 'Absent').length
  const late = logs.filter(l => l.status === 'Late').length
  const halfDay = logs.filter(l => l.status === 'Half-Day').length
  const onLeave = logs.filter(l => l.status === 'On Leave').length

  const stats = [
    { label: 'Present', value: String(present), pct: Math.round(present / total * 100), color: '#4CAF50' },
    { label: 'Absent', value: String(absent), pct: Math.round(absent / total * 100), color: '#ef4444' },
    { label: 'Late', value: String(late), pct: Math.round(late / total * 100), color: '#f59e0b' },
    { label: 'Half-Day', value: String(halfDay), pct: Math.round(halfDay / total * 100), color: '#f97316' },
    { label: 'On Leave', value: String(onLeave), pct: Math.round(onLeave / total * 100), color: '#1A78C2' },
  ]

  const filtered = logs.filter(e =>
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.id.includes(search)) &&
    (!todayFilter || e.date === new Date().toISOString().split('T')[0])
  )

  const exportCSV = () => {
    const header = ['Date', 'Employee', 'ID', 'Department', 'Check In', 'Check Out', 'Status', 'Overtime']
    const rows = filtered.map(l => [l.date, l.name, l.id, l.dept, l.in, l.out, l.status, l.ot])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_log_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Daily attendance monitoring with login/logout tracking.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{s.pct}%</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTodayFilter(!todayFilter)} className={`btn-secondary text-xs ${todayFilter ? 'bg-primary text-white' : ''}`}><CalendarDays className="w-4 h-4" /> {todayFilter ? 'All Dates' : 'Today'}</button>
            <button onClick={exportCSV} className="btn-secondary text-xs"><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header">{['Date', 'Employee', 'Dept', 'In', 'Out', 'Status', 'Overtime'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No attendance records found</td></tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{log.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
                          {log.name.split(' ').map(n => n[0]).join('')}</div>
                        <div><div className="font-medium" style={{ color: 'var(--text-primary)' }}>{log.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.id}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--hover)', color: 'var(--text-secondary)' }}>{log.dept}</span></td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{log.in}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{log.out}</td>
                    <td className="px-4 py-3"><span className={`badge ${log.status === 'Present' ? 'badge-success' : log.status === 'Absent' ? 'badge-danger' : 'badge-warning'}`}>{log.status}</span></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{log.ot}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AttendanceList
