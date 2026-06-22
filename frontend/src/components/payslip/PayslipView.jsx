import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, HardHat } from 'lucide-react'
import { getPayrollRecords, getEmployee } from '../../lib/db'

function PayslipView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const records = await getPayrollRecords()
        const found = records.find(r => r.id === id)
        if (found) {
          setRecord(found)
          const employee = await getEmployee(found.employee_id).catch(err => { console.error('Failed to load employee:', err); return null })
          setEmp(employee)
        }
      } catch (e) {
        console.error('Failed to load payslip:', e)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!record) return <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Payslip not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/payroll')} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: 'var(--text-secondary)' }}><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payslip</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Salary details for {record.month || 'Current'} {record.year || ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary text-xs"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={() => window.print()} className="btn-primary text-xs"><Download className="w-4 h-4" /> Download PDF</button>
        </div>
      </div>

      <div className="card p-8" id="payslip">
        <div className="flex items-center justify-between pb-6" style={{ borderBottom: '2px dashed var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Digital Verto</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>crm.digitalverto.com</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>PAYSLIP</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.month || ''} {record.year || ''}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>EMPLOYEE DETAILS</h3>
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Name', value: record.name || emp?.name || '-' },
                { label: 'Employee ID', value: record.employee_id || '-' },
                { label: 'Department', value: emp?.dept || '-' },
                { label: 'Designation', value: emp?.designation || '-' },
                { label: 'PAN', value: emp?.pan || '—' },
                { label: 'UAN', value: emp?.uan || '-' },
              ].map((f, i) => (
                <div key={i} className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>{f.label}</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{f.value}</span></div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>PAYMENT DETAILS</h3>
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Bank Name', value: emp?.bank_name || '—' },
                { label: 'Account No', value: emp?.bank_acc || '—' },
                { label: 'IFSC Code', value: emp?.ifsc || '—' },
                { label: 'Pay Period', value: `${record.month || ''} ${record.year || ''}` },
                { label: 'Pay Date', value: record.processed_at ? new Date(record.processed_at).toLocaleDateString() : 'N/A' },
                { label: 'Pay Mode', value: 'Bank Transfer' },
              ].map((f, i) => (
                <div key={i} className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>{f.label}</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{f.value}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
          <div>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#4CAF50' }}>EARNINGS</h3>
            <div className="space-y-2">
              {[
                { label: 'Basic Salary', amount: Number(record.basic) || 0 },
                { label: 'Dearness Allowance', amount: 0 },
                { label: 'House Rent Allowance', amount: 0 },
                { label: 'Overtime', amount: Number(record.ot_amount) || 0 },
              ].map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1"><span style={{ color: 'var(--text-secondary)' }}>{e.label}</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>₹{e.amount.toLocaleString()}</span></div>
              ))}
              <div className="flex justify-between text-sm pt-3 mt-3 font-bold" style={{ borderTop: '2px solid var(--border)', color: '#4CAF50' }}>
                <span>Total Earnings</span><span>₹{Number(record.basic || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#1A78C2' }}>DEDUCTIONS</h3>
            <div className="space-y-2">
              {[
                { label: 'Provident Fund (PF)', amount: Number(record.pf_amount || record.deductions || 0) },
                { label: 'ESIC', amount: Number(record.esic_amount || 0) },
                { label: 'Professional Tax', amount: Number(record.pt_amount || 0) },
                { label: 'Income Tax', amount: Number(record.tax_amount || 0) },
              ].map((d, i) => (
                <div key={i} className="flex justify-between text-sm py-1"><span style={{ color: 'var(--text-secondary)' }}>{d.label}</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>₹{d.amount.toLocaleString()}</span></div>
              ))}
              <div className="flex justify-between text-sm pt-3 mt-3 font-bold" style={{ borderTop: '2px solid var(--border)', color: '#1A78C2' }}>
                <span>Total Deductions</span><span>₹{Number(record.deductions || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl flex items-center justify-between" style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Net Salary Payable</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Rupees {Number(record.net_pay || 0).toLocaleString()} Only</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(record.net_pay || 0).toLocaleString()}</div>
        </div>

        <div className="flex justify-between text-xs pt-6" style={{ color: 'var(--text-muted)' }}>
          <span>This is a computer-generated payslip and does not require a signature.</span>
          <span>{record.processed_at ? `Generated on: ${new Date(record.processed_at).toLocaleDateString()}` : ''}</span>
        </div>
      </div>
    </div>
  )
}

export default PayslipView
