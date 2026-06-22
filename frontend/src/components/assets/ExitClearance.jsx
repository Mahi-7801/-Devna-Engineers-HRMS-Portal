import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Laptop, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react'
import { getEmployees, getAssetRecoveries } from '../../lib/db'

function ExitClearance() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [checklist, setChecklist] = useState([false, false, false])
  const [loading, setLoading] = useState(true)
  const pendingCount = checklist.filter(c => !c).length
  const steps = ['Resignation', 'Asset Return', 'Recovery Balance', 'Final Settlement']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Exit & Clearance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Employee offboarding, asset recovery, and final settlement.</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all`}
                style={{
                  background: i <= step ? 'var(--color-primary)' : 'var(--hover)',
                  color: i <= step ? '#fff' : 'var(--text-muted)'
                }}>
                {i + 1}
              </div>
              <span className="text-xs font-medium" style={{ color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? 'var(--color-primary)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Employee</label>
            <select className="input-field" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.employee_id || e.id} value={e.employee_id || e.id}>
                  {e.name} ({e.employee_id}) — {e.department || ''} — {e.designation || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Resignation Date</label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Last Working Day</label>
              <input type="date" className="input-field" />
            </div>
          </div>

          <div className="card p-4" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Clearance Checklist</h3>
            <div className="space-y-2.5">
              {[
                { icon: Laptop, label: 'Asset Return', desc: 'All allocated assets must be returned' },
                { icon: DollarSign, label: 'Recovery Balance', desc: 'Outstanding balance to be calculated' },
                { icon: User, label: 'HR Interview', desc: 'Exit interview form to be completed' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--hover)' }}>
                  <input type="checkbox" checked={checklist[i]} onChange={e => { const c = [...checklist]; c[i] = e.target.checked; setChecklist(c) }} className="accent-primary w-4 h-4" />
                  <item.icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#4CAF50' }} />
            <div className="flex-1 text-sm"><span className="font-medium" style={{ color: '#4CAF50' }}>Pending:</span> <span style={{ color: 'var(--text-secondary)' }}>{pendingCount} clearance item{pendingCount !== 1 ? 's' : ''} not yet completed</span></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => navigate('/app/assets')} className="btn-secondary">Cancel</button>
            <button onClick={() => {
              if (!selectedEmployee) { alert('Please select an employee'); return }
              if (window.confirm('Process exit clearance for this employee?')) {
                alert('Exit clearance submitted successfully.')
                navigate('/app/assets')
              }
            }} className="btn-primary"><CheckCircle className="w-4 h-4" /> Process Clearance</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExitClearance
