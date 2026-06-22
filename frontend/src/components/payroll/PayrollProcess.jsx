import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Info } from 'lucide-react'
import { getSalaryData, createPayrollRecord, getAssetRecoveries, updateAssetRecovery } from '../../lib/db'

function PayrollProcess() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [employees, setEmployees] = useState([])
  const [recoveries, setRecoveries] = useState([])

  useEffect(() => {
    Promise.all([getSalaryData(), getAssetRecoveries()]).then(([salaries, recs]) => {
      setEmployees(salaries.map(s => ({
        id: s.employee_id,
        name: s.name,
        basic: Number(s.basic) || 0,
        da: 0,
        hra: 0,
        ot: Number(s.ot_amount) || 0,
        pf: 0,
        esic: 0,
        tax: 0,
        incentive: 0,
        bonus: 0
      })))
      setRecoveries(recs || [])
    }).catch(err => console.error('Failed to load payroll data:', err))
  }, [])

  const toggleAll = () => setSelected(selected.length === employees.length ? [] : employees.map(e => e.id))
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const sel = employees.filter(e => selected.includes(e.id))
  const totalEarnings = sel.reduce((s, e) => s + e.basic + e.da + e.hra + e.ot + e.incentive + e.bonus, 0)
  const totalDed = sel.reduce((s, e) => s + e.pf + e.esic + e.tax, 0)

  const handleProcess = async () => {
    const month = new Date().toLocaleString('default', { month: 'long' })
    const year = new Date().getFullYear()
    try {
      for (const emp of sel) {
        const earnings = emp.basic + emp.da + emp.hra + emp.ot + emp.incentive + emp.bonus
        const ded = emp.pf + emp.esic + emp.tax
        await createPayrollRecord({
          employee_id: emp.id,
          name: emp.name,
          month,
          year,
          basic: emp.basic,
          ot_amount: emp.ot,
          deductions: ded,
          net_pay: earnings - ded,
          status: 'Processed',
          processed_by: 'System',
          processed_at: new Date().toISOString()
        })
        const empRecs = recoveries.filter(r => r.employee_id === emp.id && r.status === 'Active')
        for (const rec of empRecs) {
          const newPaid = Number(rec.paid) + Number(rec.emi)
          const newMonthsLeft = Math.max(0, (rec.months_left || 1) - 1)
          const isCompleted = newPaid >= Number(rec.total) || newMonthsLeft === 0
          await updateAssetRecovery(rec.id, {
            paid: isCompleted ? rec.total : newPaid,
            months_left: newMonthsLeft,
            status: isCompleted ? 'Completed' : 'Active',
            emi: isCompleted ? 0 : rec.emi,
            next_due: isCompleted ? '-' : rec.next_due
          })
        }
      }
      alert(`Payroll processed successfully for ${sel.length} employees!`)
      navigate('/app/payroll')
    } catch (err) {
      alert('Failed to process payroll: ' + err.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/payroll')} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: 'var(--text-secondary)' }}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Process Payroll</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review and process salary for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Selected', value: selected.length, color: 'var(--text-primary)' },
          { label: 'Total Earnings', value: `₹${totalEarnings.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Total Deductions', value: `₹${totalDed.toLocaleString()}`, color: '#1A78C2' },
          { label: 'Net Payable', value: `₹${(totalEarnings - totalDed).toLocaleString()}`, color: '#4CAF50' },
        ].map((s, i) => (
          <div key={i} className="card p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div><div className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div></div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 flex items-center gap-2 text-xs" style={{ background: 'var(--hover)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          <Info className="w-3.5 h-3.5" /> Select employees, review earnings & deductions, then process
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="w-12"><input type="checkbox" checked={selected.length === employees.length && employees.length > 0} onChange={toggleAll} className="accent-primary w-4 h-4" /></th>
                <th>Employee</th>
                <th>Basic</th><th>DA</th><th>HRA</th><th>OT</th><th>Incentive</th><th>Bonus</th>
                <th className="text-success">Earnings</th><th className="text-danger">Deductions</th><th className="text-success">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const earnings = emp.basic + emp.da + emp.hra + emp.ot + emp.incentive + emp.bonus
                const ded = emp.pf + emp.esic + emp.tax
                return (
                  <tr key={emp.id} className="table-row" style={selected.includes(emp.id) ? { background: 'color-mix(in srgb, var(--color-primary) 4%, transparent)' } : {}}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggle(emp.id)} className="accent-primary w-4 h-4" /></td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.basic.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.da.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.hra.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.ot.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.incentive.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>₹{emp.bonus.toLocaleString()}</td>
                    <td className="px-3 py-3 font-medium" style={{ color: '#4CAF50' }}>₹{earnings.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: '#1A78C2' }}>₹{ded.toLocaleString()}</td>
                    <td className="px-3 py-3 font-medium" style={{ color: '#4CAF50' }}>₹{(earnings - ded).toLocaleString()}</td>
                  </tr>
                )
              })}
              {employees.length === 0 && (
                <tr><td colSpan="11" className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No salary data available. Add employees first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 flex-wrap">
        <button onClick={() => navigate('/app/payroll')} className="btn-secondary">Cancel</button>
        
        <button disabled={selected.length === 0} onClick={handleProcess} className="btn-primary" style={{ opacity: selected.length === 0 ? 0.5 : 1 }}>
          <Download className="w-4 h-4 shrink-0" /> Process ({selected.length})
        </button>
      </div>
    </div>
  )
}

export default PayrollProcess
