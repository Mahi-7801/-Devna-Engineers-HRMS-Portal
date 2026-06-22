import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, Sun, Moon, Star, Clock, AlertCircle } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getSalaryData, getAssetRecoveries, updateAssetRecovery } from '../../lib/db'

const shiftIcons = { Morning: Sun, Evening: Star, Night: Moon }
const shiftColors = { Morning: '#4CAF50', Evening: '#1A78C2', Night: '#1A78C2' }

function PaySalary() {
  const { role } = useTheme()
  const navigate = useNavigate()

  if (role !== 'super_admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  const [allEmployees, setAllEmployees] = useState([])
  const [selected, setSelected] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [recoveries, setRecoveries] = useState([])

  useEffect(() => {
    getSalaryData().then(data => {
      setAllEmployees((data || []).map(e => ({ ...e, id: e.employee_id, perDay: e.per_day, monthlyHrs: e.monthly_hrs, otHrs: e.ot_hrs, otAmount: e.ot_amount })))
    }).catch(err => { console.error('Failed to load salary data:', err); alert('Failed to load salary data') })

    getAssetRecoveries().then(data => {
      setRecoveries(data || [])
    }).catch(err => { console.error('Failed to load recoveries:', err); alert('Failed to load recoveries') })
  }, [])

  const toggleAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false) }
    else { setSelected(allEmployees.map(e => e.id)); setSelectAll(true) }
  }

  const toggle = (id) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      setSelectAll(next.length === allEmployees.length)
      return next
    })
  }

  const getEmpDeduction = (empId) => {
    return recoveries
      .filter(r => r.employeeId === empId && r.status === 'Active')
      .reduce((sum, r) => sum + r.emi, 0)
  }

  const handlePay = async () => {
    try {
      for (const recovery of recoveries) {
        if (selected.includes(recovery.employeeId) && recovery.status === 'Active') {
          const newPaid = recovery.paid + recovery.emi
          const newMonthsLeft = Math.max(0, recovery.monthsLeft - 1)
          const isCompleted = newPaid >= recovery.total || newMonthsLeft === 0
          await updateAssetRecovery(recovery.id, {
            paid: isCompleted ? recovery.total : newPaid,
            monthsLeft: newMonthsLeft,
            status: isCompleted ? 'Completed' : 'Active',
            emi: isCompleted ? 0 : recovery.emi,
            nextDue: isCompleted ? '-' : recovery.nextDue
          })
        }
      }
      const updatedRecoveries = await getAssetRecoveries()
      setRecoveries(updatedRecoveries || [])
      alert(`Successfully processed payroll of ₹${totalPayable.toLocaleString()} for ${selected.length} employees!`)
      setSelected([])
      setSelectAll(false)
      navigate('/app/employees')
    } catch (err) {
      console.error('Failed to process payroll:', err)
      alert('Failed to process payroll')
    }
  }

  const sel = allEmployees.filter(e => selected.includes(e.id))
  const totalBasic = sel.reduce((s, e) => s + e.basic, 0)
  const totalOt = sel.reduce((s, e) => s + e.otAmount, 0)
  const totalDeductions = sel.reduce((s, e) => s + getEmpDeduction(e.id), 0)
  const totalPayable = totalBasic + totalOt - totalDeductions

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/employees')} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pay Salary</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Select employees and process salary with shift, OT, and EMI recoveries.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Employees Selected', value: selected.length, color: 'var(--text-primary)' },
          { label: 'Total Basic Salary', value: `₹${totalBasic.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Total Deductions (EMI)', value: `₹${totalDeductions.toLocaleString()}`, color: '#ef4444' },
          { label: 'Total Payable', value: `₹${totalPayable.toLocaleString()}`, color: '#1A78C2' },
        ].map((s, i) => (
          <div key={i} className="card p-5"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div><div className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div></div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex items-center gap-2 text-xs" style={{ background: 'color-mix(in srgb, #1A78C2 6%, transparent)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
          <AlertCircle className="w-3.5 h-3.5" style={{ color: '#1A78C2' }} />
          Salary calculated based on shift type — Morning (base), Evening (+10% allowance), Night (+20% allowance), less outstanding EMI deductions.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="w-12"><input type="checkbox" checked={selectAll} onChange={toggleAll} className="accent-primary w-4 h-4" /></th>
                <th>Employee</th>
                <th>Dept</th>
                <th>Shift</th>
                <th>Monthly Hrs</th>
                <th>Per Day (₹)</th>
                <th>Basic (₹)</th>
                <th>OT Hrs</th>
                <th>OT Amount (₹)</th>
                <th className="text-rose-600">Deductions (₹)</th>
                <th className="text-primary">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {allEmployees.map((emp, i) => {
                const ShiftIcon = shiftIcons[emp.shift]
                const shiftColor = shiftColors[emp.shift]
                const emiDeduction = getEmpDeduction(emp.id)
                const total = emp.basic + emp.otAmount - emiDeduction
                const isSelected = selected.includes(emp.id)
                return (
                  <tr key={emp.id} className="table-row" style={isSelected ? { background: 'color-mix(in srgb, var(--color-primary) 4%, transparent)' } : {}}>
                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggle(emp.id)} className="accent-primary w-4 h-4" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: '#1A78C2' }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{emp.dept}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: `${shiftColor}15`, color: shiftColor }}>
                        <ShiftIcon className="w-3 h-3" /> {emp.shift}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.monthlyHrs}h</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.perDay.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.basic.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color: '#4CAF50' }}>{emp.otHrs}h</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#4CAF50' }}>₹{emp.otAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-rose-600">₹{emiDeduction.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-primary)' }}>₹{total.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 flex-wrap">
        <button onClick={() => navigate('/app/employees')} className="btn-secondary shrink-0">Cancel</button>
        <button onClick={handlePay} disabled={selected.length === 0} className="btn-primary" style={{ opacity: selected.length === 0 ? 0.5 : 1 }}>
          <DollarSign className="w-4 h-4 shrink-0" /> Pay Selected ({selected.length}) — ₹{totalPayable.toLocaleString()}
        </button>
      </div>
    </div>
  )
}

export default PaySalary
