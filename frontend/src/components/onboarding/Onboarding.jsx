import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, Upload, User, Briefcase, Landmark, FileText, Package, ThumbsUp, DollarSign } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { useAuth } from '../../lib/AuthContext'
import { createEmployee, upsertSalaryData, createAssetRecovery, getEmployees, getDepartments, createNotification, createAuditLog } from '../../lib/db'
import supabase from '../../lib/supabase'

const steps = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Employment', icon: Briefcase },
  { id: 3, label: 'Bank Details', icon: Landmark },
  { id: 4, label: 'Documents', icon: FileText },
  { id: 5, label: 'Asset Allocation', icon: Package },
  { id: 6, label: 'Final Approval', icon: ThumbsUp },
]

function Onboarding() {
  const navigate = useNavigate()
  const { role: userRole } = useTheme()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [deptOptions, setDeptOptions] = useState(['Production','HR','Finance','IT','Warehouse','Quality','Admin'])
  const [managerOptions, setManagerOptions] = useState([])

  useEffect(() => {
    getDepartments().then(d => {
      if (d && d.length) setDeptOptions(d.map(x => x.name))
    }).catch(() => {})
    getEmployees().then(e => {
      setManagerOptions(e.map(x => x.name))
    }).catch(() => {})
  }, [])

  const [personal, setPersonal] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: ''
  })

  const [employment, setEmployment] = useState({
    dept: '',
    designation: '',
    empType: 'Permanent',
    doj: '',
    probation: '',
    manager: '',
    basicSalary: '',
    otRate: ''
  })

  const [bank, setBank] = useState({
    bankName: '',
    bankAcc: '',
    ifsc: '',
    uan: '',
    esic: '',
    pan: ''
  })

  const [allocatedAssets, setAllocatedAssets] = useState({
    'Safety Helmet': { checked: false, cost: 0 },
    'Work Gloves': { checked: false, cost: 0 },
    'Safety Shoes': { checked: false, cost: 0 },
    'Uniform Set': { checked: false, cost: 0 },
    'ID Card': { checked: false, cost: 0 }
  })

  const handlePersonalChange = (e) => setPersonal({ ...personal, [e.target.name]: e.target.value })
  const handleEmploymentChange = (e) => setEmployment({ ...employment, [e.target.name]: e.target.value })
  const handleBankChange = (e) => setBank({ ...bank, [e.target.name]: e.target.value })

  const handleAssetToggle = (name, checked) => {
    setAllocatedAssets(prev => ({
      ...prev,
      [name]: { ...prev[name], checked }
    }))
  }

  const handleAssetCostChange = (name, cost) => {
    setAllocatedAssets(prev => ({
      ...prev,
      [name]: { ...prev[name], cost: Number(cost) }
    }))
  }

  // Calculate dynamic costs
  const totalAssetCost = Object.values(allocatedAssets)
    .filter(a => a.checked)
    .reduce((sum, a) => sum + a.cost, 0)

  const monthlyEMI = Math.round(totalAssetCost / 12)

  const handleCompleteOnboarding = async () => {
    const empId = `devna_A${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`
    if (!personal.email) {
      alert('Email is required. Please fill in the Email field on Step 1 (Personal Information).')
      return
    }
    try {
      await createEmployee({
        employee_id: empId,
        password: '',
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        dept: employment.dept,
        designation: employment.designation,
        doj: employment.doj,
        bank_name: bank.bankName,
        bank_acc: bank.bankAcc,
        ifsc: bank.ifsc,
        uan: bank.uan,
        esic: bank.esic,
        address: personal.address,
        status: 'Active'
      })

      await upsertSalaryData({
        employee_id: empId,
        name: personal.name,
        dept: employment.dept,
        shift: '',
        monthly_hrs: 0,
        per_day: Math.round(Number(employment.basicSalary) / 22),
        ot_hrs: 0,
        ot_rate: Number(employment.otRate),
        ot_amount: 0,
        basic: Number(employment.basicSalary),
        status: 'Active'
      })

      if (totalAssetCost > 0) {
        const checkedAssetsNames = Object.keys(allocatedAssets).filter(k => allocatedAssets[k].checked)
        await createAssetRecovery({
          recovery_id: `REC_${Date.now()}`,
          employee_id: empId,
          employee_name: personal.name,
          asset_name: `Onboarding Gear (${checkedAssetsNames.join(', ')})`,
          total: totalAssetCost,
          paid: 0,
          emi: monthlyEMI,
          next_due: '',
          status: 'Active',
          months_left: 12,
          is_equipment: true,
          is_joining_kit: true
        })
      }

      const netSalary = Number(employment.basicSalary) - monthlyEMI
      const assetsArray = Object.entries(allocatedAssets)
        .filter(([, v]) => v.checked)
        .map(([name, v]) => ({ name, cost: v.cost }))

      try {
        await fetch('https://Mahi7801-Devna-Engineers-HRMS-Portal.hf.space/api/email/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: personal.email,
            name: personal.name,
            employeeId: empId,
            password: '',
            department: employment.dept,
            designation: employment.designation,
            role: userRole,
            basicSalary: employment.basicSalary,
            otRate: employment.otRate,
            allocatedAssets: assetsArray,
            totalAssetCost,
            monthlyEMI,
            netSalary
          })
        })
      } catch (emailErr) {
        console.error('Failed to send onboarding email:', emailErr)
      }

      try {
        if (user?.id) {
          await createNotification({ user_id: user.id, title: 'Employee Onboarded', message: `${personal.name} has been onboarded as ${employment.designation || 'Employee'}.` })
        }
        await createNotification({ employee_id: empId, title: 'Welcome Aboard!', message: `Your onboarding is complete. Welcome to the team!` })
      } catch (notifErr) { console.error('Failed to send notification:', notifErr) }

      createAuditLog({ action: 'Onboarded employee', table_name: 'employees', record_id: empId, performed_by: 'admin', details: `Onboarded ${personal.name} (${empId}) as ${employment.designation || 'Employee'} in ${employment.dept || 'N/A'} department` })
      alert(`Employee ${personal.name} onboarded successfully with ID ${empId}!`)
      navigate('/app/employees')
    } catch (err) {
      const msg = err?.message || ''
      console.error('Onboarding error:', { msg, email: personal.email, id: empId })
      if (msg.includes('employees_email_key')) {
        alert(`The email "${personal.email}" is already registered. Please use a different email address (Step 1 - Personal Information).`)
      } else if (msg.includes('employees_employee_id_key')) {
        alert('This Employee ID already exists. Please try again.')
      } else {
        alert('Failed to onboard employee: ' + msg)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/employees')} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Onboarding</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Multi-step employee registration wizard</p>
        </div>
      </div>

      <div className="step-indicator overflow-x-auto p-4 card">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`step ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
              <div className="step-number">{step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}</div>
              <span className="hidden sm:inline text-xs">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-connector ${step > s.id ? 'completed' : ''} ${step === s.id + 1 ? 'active' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6 animate-fade-in">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><User className="w-5 h-5 text-primary" /> Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" name="name" value={personal.name} onChange={handlePersonalChange} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" name="email" value={personal.email} onChange={handlePersonalChange} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                <input type="text" name="phone" value={personal.phone} onChange={handlePersonalChange} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
                <input type="date" name="dob" value={personal.dob} onChange={handlePersonalChange} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Gender</label>
                <select name="gender" value={personal.gender} onChange={handlePersonalChange} className="input-field">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Blood Group</label>
                <select name="bloodGroup" value={personal.bloodGroup} onChange={handlePersonalChange} className="input-field">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Address</label>
                <textarea name="address" value={personal.address} onChange={handlePersonalChange} className="input-field resize-none" rows={2} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Briefcase className="w-5 h-5 text-primary" /> Employment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Department</label>
                <select name="dept" value={employment.dept} onChange={handleEmploymentChange} className="input-field">
                  <option value="">Select Department</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Designation</label>
                <select name="designation" value={employment.designation} onChange={handleEmploymentChange} className="input-field">
                  <option value="">Select Designation</option>
                  {['Super Admin', 'Admin Manager'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Employment Type</label>
                <select name="empType" value={employment.empType} onChange={handleEmploymentChange} className="input-field">
                  {['Permanent', 'Contract', 'Probation', 'Intern'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Date of Joining</label>
                <input type="date" name="doj" value={employment.doj} onChange={handleEmploymentChange} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Probation Period</label>
                <select name="probation" value={employment.probation} onChange={handleEmploymentChange} className="input-field">
                  <option value="">Select Probation</option>
                  {['1 Month', '2 Months', '3 Months', '6 Months'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Reporting Manager</label>
                <select name="manager" value={employment.manager} onChange={handleEmploymentChange} className="input-field">
                  <option value="">Select Manager</option>
                  {managerOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Added Compensation Inputs */}
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Basic Salary (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-440 font-medium text-xs">₹</span>
                  <input type="number" name="basicSalary" value={employment.basicSalary} onChange={handleEmploymentChange} className="input-field pl-9" min="0" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Overtime Rate (₹/hour)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-440 font-medium text-xs">₹</span>
                  <input type="number" name="otRate" value={employment.otRate} onChange={handleEmploymentChange} className="input-field pl-9" min="0" required />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Landmark className="w-5 h-5 text-primary" /> Bank & Statutory Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(bank).map((key) => {
                const label = key === 'bankName' ? 'Bank Name' :
                              key === 'bankAcc' ? 'Account Number' :
                              key === 'ifsc' ? 'IFSC Code' :
                              key === 'uan' ? 'UAN Number' :
                              key === 'esic' ? 'ESIC Number' : 'PAN Card'
                return (
                  <div key={key}>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                    <input name={key} value={bank[key]} onChange={handleBankChange} className="input-field" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><FileText className="w-5 h-5 text-primary" /> Document Upload</h2>
            {['Aadhar Card', 'PAN Card', 'Offer Letter', 'Address Proof', 'Education Certificates'].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--hover)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{doc}</span>
                <div className="border-2 border-dashed rounded-xl px-4 py-2 text-xs cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <Upload className="w-4 h-4 inline mr-1" /> Uploaded
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Asset Allocation & Cost Setup</h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select assets to allocate to the employee and customize deduction costs. Deductions will be spread over a year (12 months).</p>
            
            <div className="space-y-3 mt-2">
              {Object.keys(allocatedAssets).map((assetName) => {
                const asset = allocatedAssets[assetName]
                return (
                  <div key={assetName} className="flex items-center justify-between p-3.5 rounded-xl transition-colors" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={asset.checked} 
                        onChange={e => handleAssetToggle(assetName, e.target.checked)}
                        className="accent-primary w-4.5 h-4.5 cursor-pointer" 
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{assetName}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Cost (₹):</span>
                      <input 
                        type="number" 
                        value={asset.cost} 
                        onChange={e => handleAssetCostChange(assetName, Number(e.target.value))}
                        disabled={!asset.checked}
                        className="w-20 text-right px-2.5 py-1 rounded-lg border text-xs font-semibold"
                        style={{
                          borderColor: 'var(--border)',
                          background: asset.checked ? 'var(--bg-card)' : 'transparent',
                          color: 'var(--text-primary)',
                          opacity: asset.checked ? 1 : 0.5
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {totalAssetCost > 0 && (
              <div className="p-4 rounded-xl space-y-2 mt-4 text-xs bg-primary/5 border border-primary/10">
                <div className="flex justify-between font-medium">
                  <span style={{ color: 'var(--text-secondary)' }}>Total Gear Value:</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{totalAssetCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-500">
                  <span>Deduction Plan (Year-Cut):</span>
                  <span>₹{monthlyEMI.toLocaleString()} / month (12 months)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-6 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <ThumbsUp className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-lg font-bold mt-4" style={{ color: 'var(--text-primary)' }}>Ready for Approval</h2>
            <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>All information has been collected. Review the compensation and deduction breakdown below, then click Complete to save the employee to the registry.</p>
            
            <div className="mt-6 p-5 rounded-xl text-left space-y-4 max-w-lg mx-auto" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Onboarding Profile Summary</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-450 block font-medium">Employee Name:</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{personal.name}</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-medium">Department & Designation:</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{employment.dept} · {employment.designation}</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-medium">Base Salary:</span>
                  <span className="font-bold text-sm text-emerald-500">₹{Number(employment.basicSalary).toLocaleString()} / month</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-medium">Overtime Rate:</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{employment.otRate}/hour</span>
                </div>
              </div>

              {totalAssetCost > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Equipment & Deductions Plan (1st Year):</div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Allocated Gear: {Object.keys(allocatedAssets).filter(k => allocatedAssets[k].checked).join(', ')}</span>
                    <span className="font-bold">Total Cost: ₹{totalAssetCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <span>Paycheck EMI Deduction (12 Months):</span>
                    <span>-₹{monthlyEMI.toLocaleString()} / month</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-primary p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span>Estimated Net Base Salary (Paycheck Cash):</span>
                    <span>₹{(Number(employment.basicSalary) - monthlyEMI).toLocaleString()} / month</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="btn-secondary" style={{ opacity: step === 1 ? 0.5 : 1 }}>Previous</button>
        {step < 6 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary"><ChevronRight className="w-4 h-4" /> Next Step</button>
        ) : (
          <button onClick={handleCompleteOnboarding} className="btn-primary"><Check className="w-4 h-4" /> Complete Onboarding</button>
        )}
      </div>
    </div>
  )
}

export default Onboarding
