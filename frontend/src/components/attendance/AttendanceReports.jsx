import { useState, useEffect } from 'react'
import { Search, Download, Filter } from 'lucide-react'
import { getAttendanceReport, getEmployees } from '../../lib/db'

function AttendanceReports() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ dept: 'All', employeeId: '', fromDate: '', toDate: '' })
  const [departments, setDepartments] = useState(['All'])

  useEffect(() => {
    getEmployees().then(data => {
      const emps = data || []
      setEmployees(emps)
      const depts = [...new Set(emps.map(e => e.department || 'Unknown').filter(Boolean))]
      setDepartments(['All', ...depts.sort()])
    }).catch(err => console.error(err))
    loadData()
  }, [])

  const loadData = async (f = filters) => {
    setLoading(true)
    try {
      const attendance = await getAttendanceReport({
        dept: f.dept === 'All' ? undefined : f.dept,
        employeeId: f.employeeId || undefined,
        fromDate: f.fromDate || undefined,
        toDate: f.toDate || undefined
      })
      const empStats = {}
      attendance.forEach(r => {
        const eid = r.employee_id
        if (!empStats[eid]) {
          empStats[eid] = {
            name: r.employees?.name || 'Unknown',
            dept: r.employees?.department || '',
            id: eid,
            p: 0, a: 0, l: 0, h: 0, lv: 0, ot: 0, days: 0
          }
        }
        empStats[eid].days++
        if (r.status === 'Present') empStats[eid].p++
        else if (r.status === 'Absent') empStats[eid].a++
        else if (r.status === 'Late') empStats[eid].l++
        else if (r.status === 'Half-Day') empStats[eid].h++
        else if (r.status === 'On Leave') empStats[eid].lv++
        empStats[eid].ot += r.overtime_minutes || 0
      })
      setReportData(Object.values(empStats))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = () => loadData(filters)

  const exportCSV = () => {
    const header = ['Employee', 'Department', 'Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'OT Hours', 'Attendance %']
    const rows = reportData.map(e => [
      e.name, e.dept, e.p, e.a, e.l, e.h, e.lv,
      Math.round(e.ot / 60) + 'h',
      e.days ? Math.round(e.p / e.days * 100) + '%' : '0%'
    ])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_report_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && reportData.length === 0) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Reports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generate and export attendance reports with filters.</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Department</label>
            <select className="input-field" value={filters.dept} onChange={e => setFilters({ ...filters, dept: e.target.value })}>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Employee</label>
            <select className="input-field" value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })}>
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>{emp.name} ({emp.employee_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>From Date</label>
            <input type="date" className="input-field" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>To Date</label>
            <input type="date" className="input-field" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleGenerate} className="btn-primary text-xs"><Search className="w-4 h-4 shrink-0" /> Generate Report</button>
          <button onClick={exportCSV} className="btn-secondary text-xs"><Download className="w-4 h-4 shrink-0" /> Export CSV</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Attendance Summary {filters.fromDate || filters.toDate ? `(${filters.fromDate || '...'} - ${filters.toDate || '...'})` : '- All Time'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header">{['Employee', 'Department', 'Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'OT Hours', 'Attendance %'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No data found for selected filters</td></tr>
              ) : (
                reportData.map((e, i) => (
                  <tr key={e.id || i} className="table-row">
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #1A78C2, #0D4F7A)' }}>
                          {e.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {e.name}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{e.dept}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#4CAF50' }}>{e.p}</td>
                    <td className="px-4 py-3" style={{ color: '#ef4444' }}>{e.a}</td>
                    <td className="px-4 py-3" style={{ color: '#f59e0b' }}>{e.l}</td>
                    <td className="px-4 py-3" style={{ color: '#f59e0b' }}>{e.h}</td>
                    <td className="px-4 py-3" style={{ color: '#1A78C2' }}>{e.lv}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{Math.round(e.ot / 60)}h</td>
                    <td className="px-4 py-3"><span className={`badge ${(e.days ? Math.round(e.p / e.days * 100) : 0) >= 75 ? 'badge-success' : 'badge-warning'}`}>{e.days ? Math.round(e.p / e.days * 100) : 0}%</span></td>
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

export default AttendanceReports
