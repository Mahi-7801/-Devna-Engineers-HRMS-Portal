import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, FileText, Filter, ChevronDown } from 'lucide-react'
import { getPayrollRecords } from '../../lib/db'

function PayrollList() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPayrollRecords().then(data => setRecords(data || [])).catch(err => console.error('Failed to load payroll records:', err)).finally(() => setLoading(false))
  }, [])

  const totalGross = records.reduce((s, r) => s + (Number(r.basic) + Number(r.ot_amount || 0)), 0)
  const totalNet = records.reduce((s, r) => s + Number(r.net_pay || 0), 0)
  const totalDed = totalGross - totalNet

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payroll Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Salary processing, payslips, and payroll reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('Export coming soon')} className="btn-secondary text-xs"><Download className="w-4 h-4" /> Export</button>
          <Link to="/app/payroll/process" className="btn-primary text-xs"><Plus className="w-4 h-4" /> Process Payroll</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Gross', value: `₹${totalGross.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Total Deductions', value: `₹${totalDed.toLocaleString()}`, color: '#1A78C2' },
          { label: 'Net Payable', value: `₹${totalNet.toLocaleString()}`, color: '#4CAF50' },
        ].map((s, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-sm"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} /><input type="text" placeholder="Search..." className="input-field pl-10" /></div>
          <button onClick={() => alert('Month filter coming soon')} className="btn-secondary text-xs"><Filter className="w-4 h-4" /> Month <ChevronDown className="w-3 h-3" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header">{['Employee', 'Month', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Payslip'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {records.map((pr, i) => (
                <tr key={pr.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: '#1A78C2' }}>
                        {(pr.name || 'NA').split(' ').map(n => n[0]).join('')}</div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pr.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{pr.month || `${pr.month_name || ''} ${pr.year || ''}`}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>₹{(Number(pr.basic) + Number(pr.ot_amount || 0)).toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: '#1A78C2' }}>₹{Number(pr.deductions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#4CAF50' }}>₹{Number(pr.net_pay || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge ${pr.status === 'Processed' ? 'badge-success' : 'badge-warning'}`}>{pr.status || 'Pending'}</span></td>
                  <td className="px-4 py-3">
                    <Link to={`/app/payroll/payslip/${pr.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                      <FileText className="w-3.5 h-3.5" /> Download
                    </Link>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan="7" className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No payroll records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PayrollList
