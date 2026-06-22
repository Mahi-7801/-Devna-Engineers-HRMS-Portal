import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { TrendingUp, Save, DollarSign, Search, CheckCircle } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getSalaryData, updateSalary } from '../../lib/db'

function SalaryIncreases() {
  const { role } = useTheme()

  if (role !== 'super_admin') {
    return <Navigate to="/app/dashboard" replace />
  }
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editBasic, setEditBasic] = useState('')
  const [showSavedMsg, setShowSavedMsg] = useState(false)

  useEffect(() => {
    getSalaryData().then(data => {
      setEmployees((data || []).map(e => ({ ...e, id: e.employee_id })))
    }).catch(err => { console.error('Failed to load salary data:', err); alert('Failed to load salary data') })
  }, [])

  const handleEdit = (emp) => {
    setEditingId(emp.id)
    setEditBasic(emp.basic.toString())
  }

  const handleSave = async (id) => {
    try {
      await updateSalary(id, { basic: Number(editBasic) })
      setEmployees(prev => prev.map(emp => {
        if (emp.id === id) {
          return { ...emp, basic: Number(editBasic) }
        }
        return emp
      }))
      setEditingId(null)

      setShowSavedMsg(true)
      setTimeout(() => setShowSavedMsg(false), 3000)
    } catch (err) {
      console.error('Failed to update salary:', err)
      alert('Failed to update salary')
    }
  }

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Salary Increases</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage and adjust basic salaries for all employees.</p>
        </div>
      </div>

      {showSavedMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-fade-in" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          <CheckCircle className="w-5 h-5" /> Salary updated successfully! It will now reflect in Payroll.
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Current Basic (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: '#1A78C2' }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{emp.dept}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{emp.shift}</td>
                  <td className="px-4 py-3 font-medium">
                    {editingId === emp.id ? (
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <DollarSign className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input type="number" value={editBasic} onChange={e => setEditBasic(e.target.value)}
                          className="w-full px-2 py-1 rounded border text-sm" autoFocus />
                      </div>
                    ) : (
                      <span style={{ color: '#1A78C2', fontSize: '15px' }}>₹{emp.basic.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(emp.id)} className="btn-primary text-xs py-1.5 px-3">
                          <Save className="w-3.5 h-3.5 shrink-0" /> Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-3">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(emp)} className="btn-secondary text-xs py-1.5 px-3">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Edit Salary
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalaryIncreases
