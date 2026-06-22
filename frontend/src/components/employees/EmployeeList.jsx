import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, Eye, Edit2, Trash2, ChevronDown, Download, Grid, List, UserPlus, DollarSign } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getEmployees, deleteEmployee, getDepartments } from '../../lib/db'

const defaultDepartments = ['Production', 'HR', 'Finance', 'IT', 'Warehouse', 'Quality', 'Admin']

function EmployeeList() {
  const { role } = useTheme()
  const [employeesData, setEmployeesData] = useState([])
  const [nameSearch, setNameSearch] = useState('')
  const [idSearch, setIdSearch] = useState('')
  const [view, setView] = useState('table')
  const [deptFilter, setDeptFilter] = useState('')
  const [extraDepts, setExtraDepts] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [emps, depts] = await Promise.all([getEmployees(), getDepartments()])
      setEmployeesData((emps || []).map(e => ({ ...e, id: e.employee_id })))
      const deptNames = (depts || []).map(d => d.name)
      const custom = deptNames.filter(n => !defaultDepartments.includes(n))
      setExtraDepts(custom)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id)
        await loadData()
      } catch (err) {
        console.error('Failed to delete employee:', err)
      }
    }
  }

  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = employeesData.filter(e =>
    (e.name?.toLowerCase() || '').includes(nameSearch.toLowerCase()) &&
    (e.id?.toLowerCase() || '').includes(idSearch.toLowerCase()) &&
    (!deptFilter || e.dept === deptFilter)
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const departments = [...new Set([...employeesData.map(e => e.dept), ...extraDepts])]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage employee records, onboarding, and profiles.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {role === 'super_admin' && (
            <Link to="/app/employees/pay-salary" className="btn-secondary text-xs"><DollarSign className="w-4 h-4 shrink-0" /> Pay Salary</Link>
          )}
          {(role === 'super_admin' || role === 'hr_manager') && (
            <>
              <Link to="/app/onboarding" className="btn-secondary text-xs"><UserPlus className="w-4 h-4 shrink-0" /> Onboarding</Link>
              <Link to="/app/employees/new" className="btn-primary text-xs"><Plus className="w-4 h-4 shrink-0" /> Add Employee</Link>
            </>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name..." value={nameSearch} onChange={e => setNameSearch(e.target.value)}
              className="input-field pl-10" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by ID..." value={idSearch} onChange={e => setIdSearch(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button onClick={() => setView('table')} className={`p-2.5 transition-colors ${view === 'table' ? 'bg-primary text-white' : ''}`} style={view !== 'table' ? { color: 'var(--text-muted)' } : {}}><List className="w-4 h-4" /></button>
            <button onClick={() => setView('grid')} className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-primary text-white' : ''}`} style={view !== 'grid' ? { color: 'var(--text-muted)' } : {}}><Grid className="w-4 h-4" /></button>
          </div>
        </div>

        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-header">
                {['Employee', 'Department', 'Designation', 'Contact', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {paged.map((emp, i) => (
                  <tr key={emp.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}</div>
                        <div><div className="font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.id}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--hover)', color: 'var(--text-secondary)' }}>{emp.dept}</span></td>
                    <td className="px-4 py-3.5" style={{ color: 'var(--text-secondary)' }}>{emp.designation}</td>
                    <td className="px-4 py-3.5"><div style={{ color: 'var(--text-secondary)' }}>{emp.email}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.phone}</div></td>
                    <td className="px-4 py-3.5"><span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{emp.status}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-0.5">
                        <Link to={`/app/employees/${emp.id}`} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></Link>
                        {(role === 'super_admin' || role === 'hr_manager') && (
                          <Link to={`/app/employees/${emp.id}/edit`} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}><Edit2 className="w-4 h-4" /></Link>
                        )}
                        {role === 'super_admin' && (
                          <button onClick={() => handleDelete(emp.id)} className="p-2 rounded-lg transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }}><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paged.map((emp, i) => (
              <div key={emp.id} className="card p-4 text-center animate-scale-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mx-auto" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
                  {emp.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{emp.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{emp.designation}</div>
                <div className="mt-2"><span className="badge-neutral badge">{emp.dept}</span></div>
                <div className="mt-3"><span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{emp.status}</span></div>
                <div className="flex justify-center gap-2 mt-4">
                  <Link to={`/app/employees/${emp.id}`} className="btn-secondary text-xs py-2 px-4">Profile</Link>
                  {(role === 'super_admin' || role === 'hr_manager') && (
                    <Link to={`/app/employees/${emp.id}/edit`} className="btn-primary text-xs py-2 px-4">Edit</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span>Showing {Math.min(safePage * perPage, filtered.length)} of {filtered.length} employees</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: safePage <= 1 ? 0.5 : 1 }}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={p === safePage ? { background: 'var(--color-primary)', color: 'white' } : { border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{p}</button>
            ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: safePage >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeList
