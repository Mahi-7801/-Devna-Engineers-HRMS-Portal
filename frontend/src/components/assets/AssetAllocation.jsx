import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, User } from 'lucide-react'
import { getEmployees, getAssets, createAssetAllocation } from '../../lib/db'

function AssetAllocation() {
  const navigate = useNavigate()
  const [recoveryType, setRecoveryType] = useState('onetime')
  const [employees, setEmployees] = useState([])
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({ asset_id: '', employee_id: '', allocation_date: '', expected_return: '', total_amount: '', emi_amount: '', tenure: '', start_month: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [emps, asts] = await Promise.all([getEmployees(), getAssets()])
      setEmployees(emps)
      setAssets(asts.filter(a => a.status === 'In Stock'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.asset_id || !form.employee_id) {
      alert('Please select an asset and employee.')
      return
    }
    setSubmitting(true)
    try {
      await createAssetAllocation({
        asset_id: form.asset_id,
        employee_id: form.employee_id,
        allocation_date: form.allocation_date || new Date().toISOString().split('T')[0],
        expected_return: form.expected_return,
        recovery_type: recoveryType,
        total_amount: form.total_amount ? Number(form.total_amount) : null,
        emi_amount: form.emi_amount ? Number(form.emi_amount) : null,
        tenure: form.tenure ? Number(form.tenure) : null,
        start_month: form.start_month,
        notes: form.notes
      })
      navigate('/app/assets')
    } catch (err) {
      console.error(err)
      alert('Failed to allocate asset.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Allocate Asset</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Assign an asset to an employee.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Asset</label>
          <select className="input-field" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
            <option value="">Select Asset</option>
            {assets.map(a => (
              <option key={a.asset_id || a.id} value={a.asset_id || a.id}>{a.name} ({a.tag || a.asset_tag})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Employee</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <select className="input-field pl-10" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.employee_id || e.id} value={e.employee_id || e.id}>{e.name} ({e.employee_id}) — {e.department}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Allocation Date</label>
          <input type="date" className="input-field" value={form.allocation_date} onChange={e => setForm({ ...form, allocation_date: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected Return</label>
          <input type="date" className="input-field" value={form.expected_return} onChange={e => setForm({ ...form, expected_return: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Recovery Type</label>
          <div className="flex gap-3">
            {[
              { value: 'onetime', label: 'One-Time', icon: ArrowDown },
              { value: 'emi', label: 'EMI (Monthly)', icon: ArrowUp },
            ].map(r => {
              const Icon = r.icon
              const active = recoveryType === r.value
              return (
                <button key={r.value} type="button" onClick={() => setRecoveryType(r.value)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                    background: active ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--text-secondary)'
                  }}>
                  <Icon className={`w-4 h-4 ${active ? '' : ''}`} />
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
        {recoveryType === 'emi' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Total Amount (₹)</label>
              <input type="number" className="input-field" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>EMI Amount (₹)</label>
              <input type="number" className="input-field" value={form.emi_amount} onChange={e => setForm({ ...form, emi_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Tenure (months)</label>
              <input type="number" className="input-field" value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Start From</label>
              <input type="month" className="input-field" value={form.start_month} onChange={e => setForm({ ...form, start_month: e.target.value })} />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</label>
          <textarea className="input-field" rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about asset allocation..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/app/assets')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}><ArrowDown className="w-4 h-4" /> {submitting ? 'Allocating...' : 'Allocate Asset'}</button>
        </div>
      </form>
    </div>
  )
}

export default AssetAllocation
