import { useState, useEffect } from 'react'
import { DollarSign, TrendingDown, RefreshCw, CheckCircle, Clock, Plus, HardHat, ShieldAlert, Sparkles, User, Calendar, Trash2, Tag } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getEmployees, getAssetRecoveries, createAssetRecovery, updateAssetRecovery } from '../../lib/db'

function AssetRecovery() {
  const { role } = useTheme()
  const [employees, setEmployees] = useState([])
  const [recoveries, setRecoveries] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    employeeId: '',
    assetType: 'Uniform/Dress',
    customAsset: '',
    cost: 0,
    recoveryMonths: 1,
    reason: 'Lost/Dropped/Damaged'
  })

  useEffect(() => {
    loadData()
  }, [])

  const normalizeRec = (r) => ({
    ...r,
    employee: r.employee_name || r.employee || '',
    employeeId: r.employee_id || r.employeeId || '',
    monthsLeft: r.months_left ?? r.monthsLeft ?? 0,
    isEquipment: r.is_equipment ?? r.isEquipment ?? false,
    isJoiningKit: r.is_joining_kit ?? r.isJoiningKit ?? false,
    nextDue: r.next_due || r.nextDue || '',
    asset: r.asset_name || r.asset || '',
  })

  const loadData = async () => {
    try {
      const [emps, recs] = await Promise.all([getEmployees(), getAssetRecoveries()])
      setEmployees(emps)
      setRecoveries((recs || []).map(normalizeRec))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const equipmentRecords = recoveries.filter(r => r.isEquipment)
  const totalEquipmentCost = equipmentRecords.reduce((sum, r) => sum + r.total, 0)
  const totalEquipmentRecovered = equipmentRecords.reduce((sum, r) => sum + r.paid, 0)
  const totalEquipmentOutstanding = totalEquipmentCost - totalEquipmentRecovered
  const lostReplacementsCount = equipmentRecords.filter(r => !r.isJoiningKit).length

  const filteredRecoveries = recoveries.filter(r => {
    if (activeFilter === 'assets') return !r.isEquipment
    if (activeFilter === 'equipment') return r.isEquipment
    return true
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' || name === 'recoveryMonths' ? Number(value) : value
    }))
  }

  const handleIssueSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employeeId) {
      alert('Please select an employee.')
      return
    }

    const selectedEmp = employees.find(emp => (emp.employee_id || emp.id) === formData.employeeId)
    const assetName = formData.assetType === 'Custom' ? formData.customAsset : formData.assetType

    const newRecovery = {
      employee_id: formData.employeeId,
      employee_name: selectedEmp ? selectedEmp.name : 'Unknown Employee',
      asset_name: formData.reason === 'Lost/Dropped/Damaged' ? `Replacement ${assetName} (Lost)` : assetName,
      total: Number(formData.cost),
      paid: 0,
      emi: Math.round(Number(formData.cost) / Number(formData.recoveryMonths)),
      next_due: '',
      status: 'Active',
      months_left: Number(formData.recoveryMonths),
      is_equipment: true,
      is_joining_kit: formData.reason === 'Joining Kit'
    }

    try {
      const created = await createAssetRecovery(newRecovery)
      setRecoveries(prev => [created, ...prev])
      setShowIssueForm(false)
      setFormData({
        employeeId: '',
        assetType: 'Uniform/Dress',
        customAsset: '',
        cost: 0,
        recoveryMonths: 1,
        reason: 'Other'
      })
      alert('Equipment issued and recovery plan saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to save recovery plan.')
    }
  }

  const handleDeleteRecovery = async (id) => {
    if (window.confirm('Are you sure you want to delete this recovery record?')) {
      try {
        await updateAssetRecovery(id, { status: 'Deleted' })
        setRecoveries(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Asset Recovery & EMI</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track deductions, outstanding balances, and safety gear costs.</p>
        </div>
        {(role === 'super_admin' || role === 'hr_manager') && (
          <button 
            onClick={() => setShowIssueForm(!showIssueForm)} 
            className="btn-primary text-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> 
            {showIssueForm ? 'Hide Form' : 'Issue Gear / Report Lost'}
          </button>
        )}
      </div>

      {showIssueForm && (
        <form onSubmit={handleIssueSubmit} className="card p-6 space-y-4 animate-slide-up border-primary/20" style={{ border: '1px solid var(--color-primary)' }}>
          <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <HardHat className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Issue Safety Equipment & Set Cost Recovery</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assign Employee</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  name="employeeId" 
                  value={formData.employeeId} 
                  onChange={handleInputChange} 
                  className="input-field pl-10" 
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employee_id || e.id} value={e.employee_id || e.id}>{e.name} ({e.employee_id || e.id}) · {e.department || e.dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Equipment / Gear Type</label>
              <select 
                name="assetType" 
                value={formData.assetType} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="Uniform/Dress">Uniform Dress</option>
                <option value="Safety Helmet">Safety Helmet</option>
                <option value="Safety Boots">Safety Boots</option>
                <option value="Custom">Custom Equipment...</option>
              </select>
            </div>

            {formData.assetType === 'Custom' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Custom Asset Name</label>
                <input 
                  type="text" 
                  name="customAsset" 
                  value={formData.customAsset} 
                  onChange={handleInputChange} 
                  className="input-field" 
                  placeholder="e.g. Safety Goggles" 
                  required 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason for Issuing</label>
              <select 
                name="reason" 
                value={formData.reason} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="Lost/Dropped/Damaged">Lost / Replacement (Deduct Cost)</option>
                <option value="Joining Kit">New Hire Joining Kit</option>
                <option value="Other">Other / Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Cost to Recover (₹)</label>
              <input 
                type="number" 
                name="cost" 
                value={formData.cost} 
                onChange={handleInputChange} 
                className="input-field" 
                min="0" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recovery Timeframe (Months)</label>
              <select 
                name="recoveryMonths" 
                value={formData.recoveryMonths} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="1">1 Month (One-Time Deduction)</option>
                <option value="3">3 Months EMI</option>
                <option value="6">6 Months EMI</option>
                <option value="12">12 Months EMI (Cut on Year)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowIssueForm(false)} className="btn-secondary text-xs">Cancel</button>
            <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Save Plan
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Uniform & Safety Equipment Cost Summary (Super Admin view)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Equipment Cost', value: `₹${totalEquipmentCost.toLocaleString()}`, icon: DollarSign, color: '#1A78C2', desc: 'Overall issued equipment costs' },
            { label: 'Deducted / Recovered', value: `₹${totalEquipmentRecovered.toLocaleString()}`, icon: TrendingDown, color: '#4CAF50', desc: 'Deducted from employee salaries' },
            { label: 'Outstanding Recovery', value: `₹${totalEquipmentOutstanding.toLocaleString()}`, icon: Clock, color: '#FF9800', desc: 'Pending to be cut from checkouts' },
            { label: 'Lost Item Replacements', value: lostReplacementsCount, icon: ShieldAlert, color: '#ef4444', desc: 'Dresses/Helmets lost by employees' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="card p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label.toUpperCase()}</div>
                  <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Deductions & Recoveries Log</h3>
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
            {[
              { id: 'all', label: 'All Recoveries' },
              { id: 'assets', label: 'Laptops & Devices' },
              { id: 'equipment', label: 'Dress & Safety Gear' }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setActiveFilter(f.id)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === f.id ? 'bg-primary text-white shadow-sm' : ''}`}
                style={activeFilter !== f.id ? { color: 'var(--text-secondary)' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRecoveries.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No recovery records found matching the active filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredRecoveries.map((r) => {
              const progress = r.total > 0 ? (r.paid / r.total) * 100 : 100
              const outstanding = r.total - r.paid
              return (
                <div key={r.id} className="card p-5 space-y-4 flex flex-col justify-between" style={{ border: r.isEquipment ? '1px solid color-mix(in srgb, var(--color-primary) 15%, var(--border))' : '1px solid var(--border)' }}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{r.employee}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{r.employeeId || r.employee_id}</div>
                      </div>
                      <span className={`badge text-[10px] ${r.status === 'Active' ? 'badge-warning' : 'badge-success'}`}>
                        {r.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {r.isEquipment ? <HardHat className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                        {r.asset}
                      </div>
                      <div className="text-[10px] text-slate-450 mt-1">
                        Type: {r.isEquipment ? 'Uniform & Safety' : 'Company Asset'}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>Recovered Balance</span>
                        <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>₹{r.paid.toLocaleString()} / ₹{r.total.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--hover)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%`, background: progress >= 100 ? '#4CAF50' : 'var(--color-primary)' }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{progress.toFixed(0)}% recovered</span>
                        <span>{r.monthsLeft} payments left</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {r.status === 'Active' && (
                      <div className="flex items-center justify-between text-[10px] p-2.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-primary) 6%, transparent)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Next Deduction</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{r.emi.toLocaleString()} / month</span>
                      </div>
                    )}
                    {outstanding > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span style={{ color: 'var(--text-muted)' }}>Outstanding Balance</span>
                        <span className="font-semibold text-rose-500">₹{outstanding.toLocaleString()}</span>
                      </div>
                    )}
                    {role === 'super_admin' && (
                      <div className="flex justify-end pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                        <button 
                          onClick={() => handleDeleteRecovery(r.id)} 
                          className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-bold"
                          title="Delete Recovery Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssetRecovery
