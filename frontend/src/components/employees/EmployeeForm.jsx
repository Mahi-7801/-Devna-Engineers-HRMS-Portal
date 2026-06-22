import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, User, Landmark, FileText, Check, DollarSign, Trash2 } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { useAuth } from '../../lib/AuthContext'
import { getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeeSalary, upsertSalaryData, getDepartments, createAssetRecovery, createNotification, createAuditLog } from '../../lib/db'
import supabase from '../../lib/supabase'

const defaultDepartments = ['Production', 'HR', 'Finance', 'IT', 'Warehouse', 'Quality', 'Admin']
const designations = ['Super Admin', 'Admin Manager', 'HR Executive', 'HR Manager', 'Accountant', 'Finance Manager', 'Production Manager', 'Production Supervisor', 'Quality Engineer', 'Warehouse Incharge', 'IT Executive', 'System Admin', 'Team Lead', 'Executive', 'Operator', 'Trainee']

const steps = [
  { id: 'personal', label: 'Personal & Professional', icon: User },
  { id: 'bank', label: 'Bank & Statutory', icon: Landmark },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'salary', label: 'Salary & Actions', icon: DollarSign }
]

function EmployeeForm() {
  const { role } = useTheme()
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [activeTab, setActiveTab] = useState('personal')
  const [basicSalary, setBasicSalary] = useState(0)
  const [otRate, setOtRate] = useState(0)
  const [issueJoiningKit, setIssueJoiningKit] = useState(true)
  const [departments, setDepartments] = useState(defaultDepartments)
  const [userRole, setUserRole] = useState('employee')
  const [savedId, setSavedId] = useState(null)
  const [savedAuthId, setSavedAuthId] = useState(null)
  const [form, setForm] = useState({
    id: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    dept: '',
    designation: '',
    doj: '',
    bankName: '',
    bankAcc: '',
    ifsc: '',
    uan: '',
    esic: '',
    address: ''
  })

  useEffect(() => {
    getDepartments().then(data => {
      const names = (data || []).map(d => d.name)
      const custom = names.filter(n => !defaultDepartments.includes(n))
      setDepartments([...defaultDepartments, ...custom])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) {
      const ts = Date.now().toString(36).slice(-4).toUpperCase()
      setForm(f => ({ ...f, id: `devna_A${ts}` }))
    }
  }, [isEdit])

  useEffect(() => {
    if (isEdit) {
      getEmployee(id).then(found => {
        if (found) {
          setForm({
            id: found.employee_id || '',
            password: found.password || '',
            name: found.name || '',
            email: found.email || '',
            phone: found.phone || '',
            dept: found.dept || '',
            designation: found.designation || '',
            doj: found.doj || '',
            bankName: found.bank_name || '',
            bankAcc: found.bank_acc || '',
            ifsc: found.ifsc || '',
            uan: found.uan || '',
            esic: found.esic || '',
            address: found.address || ''
          })
        }
      }).catch(err => console.error('Failed to load employee:', err))

      getEmployeeSalary(id).then(foundSalary => {
        if (foundSalary) {
          setBasicSalary(foundSalary.basic || 0)
          setOtRate(foundSalary.ot_rate || 0)
        }
    }).catch(err => console.error('Failed to load salary data:', err))
    }
  }, [id, isEdit])

  if (role !== 'super_admin' && role !== 'hr_manager') {
    return <Navigate to="/app/dashboard" replace />
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete employee ${form.name || id}? This cannot be undone.`)) {
      try {
        await deleteEmployee(id)
        createAuditLog({ action: 'Deleted employee', table_name: 'employees', record_id: id, performed_by: role, details: `Deleted employee ${id} (${form.name || 'Unknown'})` })
        navigate('/app/employees')
      } catch (err) {
        console.error('Failed to delete employee:', err)
        alert('Failed to delete employee')
      }
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEdit) {
        const updates = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          dept: form.dept,
          designation: form.designation,
          doj: form.doj,
          bank_name: form.bankName,
          bank_acc: form.bankAcc,
          ifsc: form.ifsc,
          uan: form.uan,
          esic: form.esic,
          address: form.address
        }
        if (role === 'super_admin') {
          updates.password = form.password
        }
        await updateEmployee(id, updates)

        const existingSalary = await getEmployeeSalary(id)
        const currentOtHrs = existingSalary?.otHrs || 0
        await upsertSalaryData({
          employee_id: id,
          name: form.name,
          dept: form.dept,
          basic: Number(basicSalary),
          per_day: Math.round(Number(basicSalary) / 22),
          ot_rate: Number(otRate),
          ot_amount: currentOtHrs * Number(otRate)
        })
        createAuditLog({ action: 'Updated employee', table_name: 'employees', record_id: id, performed_by: role, details: `Updated employee ${id} (${form.name})` })
        navigate('/app/employees')
        return
      }

      // === CREATE WIZARD ===
      if (step === 1) {
        let finalId = form.id
        if (!finalId) {
          const ts = Date.now().toString(36).slice(-4).toUpperCase()
          finalId = `devna_A${ts}`
        }
        const designation = form.designation || (userRole !== 'employee' ? Object.entries({ super_admin: 'Super Admin', hr_manager: 'HR Manager', manager: 'Manager', dept_manager: 'Dept Manager' }).find(([k]) => k === userRole)?.[1] || '' : '')
        await createEmployee({
          employee_id: finalId,
          password: form.password || '',
          name: form.name,
          email: form.email,
          phone: form.phone,
          dept: form.dept,
          designation,
          doj: form.doj,
          status: 'Active'
        })
        if (role === 'super_admin' && userRole !== 'employee') {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password || '',
            options: { data: { role: userRole, name: form.name } }
          })
          if (authError) {
            console.error('Failed to create auth user:', authError)
            alert('Employee record created but failed to create login account: ' + authError.message)
          } else if (authData?.user) {
            setSavedAuthId(authData.user.id)
          }
        }
        setSavedId(finalId)
        setStep(2)
        return
      }

      if (step === 2) {
        await updateEmployee(savedId, {
          bank_name: form.bankName,
          bank_acc: form.bankAcc,
          ifsc: form.ifsc,
          uan: form.uan,
          esic: form.esic
        })
        setStep(3)
        return
      }

      if (step === 3) {
        await updateEmployee(savedId, { address: form.address })
        setStep(4)
        return
      }

      if (step === 4) {
        await upsertSalaryData({
          employee_id: savedId,
          name: form.name,
          dept: form.dept,
          shift: 'Morning',
          monthly_hrs: 176,
          per_day: Math.round(Number(basicSalary) / 22),
          ot_hrs: 0,
          ot_rate: Number(otRate),
          ot_amount: 0,
          basic: Number(basicSalary),
          status: 'Active'
        })
        if (issueJoiningKit) {
          await createAssetRecovery({
            recovery_id: `REC_${savedId}`,
            employee_id: savedId,
            employee_name: form.name,
            asset_name: 'Mandatory Joining Kit (Uniform & Helmet)',
            total: 2400,
            paid: 0,
            emi: 200,
            next_due: '',
            status: 'Active',
            months_left: 12,
            is_equipment: true,
            is_joining_kit: true
          })
        }
        try {
          await fetch('http://localhost:3000/api/email/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email,
              name: form.name,
              employeeId: savedId,
              password: form.password || '',
              department: form.dept,
              designation: form.designation || '',
              role: userRole
            })
          })
        } catch (emailErr) {
          console.error('Failed to send profile complete email:', emailErr)
        }
        try {
          if (user?.id) {
            await createNotification({ user_id: user.id, title: 'Employee Created', message: `${form.name} has been onboarded successfully.` })
          }
          if (savedAuthId) {
            await createNotification({ user_id: savedAuthId, title: 'Welcome Aboard!', message: `Your account has been created. Welcome to the team!` })
          }
        } catch (notifErr) { console.error('Failed to send notification:', notifErr) }
        createAuditLog({ action: 'Created employee', table_name: 'employees', record_id: savedId, performed_by: role, details: `Onboarded ${form.name} (${savedId}) in ${form.dept} department` })
        navigate('/app/employees')
      }
    } catch (err) {
      const msg = err?.message || err?.error?.message || err?.description || JSON.stringify(err)
      console.error('Failed to save employee:', msg)
      if (msg?.includes?.('duplicate key') || msg?.includes?.('already exists')) {
        alert('This Employee ID or Email already exists. Please use a different Employee ID or Email.')
      } else {
        alert('Failed to save employee: ' + msg)
      }
    }
  }

  const stepLabels = ['Personal & Professional', 'Bank & Statutory', 'Documents', 'Salary & Actions']
  const isLastStep = step === 4
  const currentStep = steps[step - 1]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/employees')} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {isEdit ? 'Update employee information' : `Step ${step} of 4 — ${stepLabels[step - 1]}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          {!isEdit && (
            <div className="flex overflow-x-auto p-1 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
              {steps.map((s, i) => {
                const idx = i + 1
                const isActive = idx === step
                const isDone = idx < step
                const Icon = s.icon
                return (
                  <div key={s.id}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap
                      ${isActive ? 'bg-primary text-white font-medium shadow-sm' : ''}
                      ${isDone ? 'text-green-600 font-medium' : ''}
                      ${!isActive && !isDone ? 'text-slate-400' : ''}`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    {s.label}
                  </div>
                )
              })}
            </div>
          )}

          {isEdit && (
            <div className="flex overflow-x-auto p-1 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
              {steps.map(s => {
                if (s.id === 'bank' && role !== 'super_admin') return null
                const Icon = s.icon
                return (
                  <button key={s.id} type="button" onClick={() => setActiveTab(s.id)}
                    className={`tab-btn whitespace-nowrap ${activeTab === s.id ? 'active' : ''}`}>
                    <Icon className="w-4 h-4 inline mr-1.5" />{s.label}
                  </button>
                )
              })}
            </div>
          )}

          {isEdit && activeTab === 'personal' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ name: 'name', label: 'Full Name', req: true }, { name: 'email', label: 'Email', req: true, type: 'email' }, { name: 'phone', label: 'Phone', req: true }, { name: 'dept', label: 'Department', req: true, select: true, opts: departments }, { name: 'designation', label: 'Designation', select: true, opts: designations }, { name: 'doj', label: 'Date of Joining', type: 'date' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}{f.req && <span className="text-danger ml-0.5">*</span>}</label>
                    {f.select ? (
                      <select name={f.name} value={form[f.name]} onChange={handleChange} className="input-field" required={f.req}>
                        <option value="">Select {f.label}</option>
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input name={f.name} type={f.type || 'text'} value={form[f.name]} onChange={handleChange} className="input-field" required={f.req} />
                    )}
                  </div>
                ))}
                {role === 'super_admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employee ID <span className="text-danger ml-0.5">*</span></label>
                      <input name="id" type="text" value={form.id} onChange={handleChange} className="input-field" required placeholder="e.g. EMP001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password <span className="text-danger ml-0.5">*</span></label>
<input name="password" type="text" value={form.password} onChange={handleChange} className="input-field" required placeholder="Enter password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role / Access Level <span className="text-danger ml-0.5">*</span></label>
                      <select value={userRole} onChange={e => setUserRole(e.target.value)} className="input-field">
                        <option value="employee">Employee</option>
                        <option value="dept_manager">Department Manager</option>
                        <option value="manager">Manager</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        {userRole === 'super_admin' ? 'Full access to all modules, settings, and user management.' :
                         userRole === 'hr_manager' ? 'Employee management, attendance, approvals, and reports.' :
                         userRole === 'manager' ? 'Attendance, leave approval, and shift management.' :
                         userRole === 'dept_manager' ? 'Department-level attendance and approvals.' :
                         'Personal dashboard, attendance, payslips, and self-service.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {isEdit && activeTab === 'bank' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ name: 'bankName', label: 'Bank Name' }, { name: 'bankAcc', label: 'Account Number' }, { name: 'ifsc', label: 'IFSC Code' }, { name: 'uan', label: 'UAN Number' }, { name: 'esic', label: 'ESIC Number' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input name={f.name} value={form[f.name]} onChange={handleChange} className="input-field" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEdit && activeTab === 'documents' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Upload Documents</label>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all" style={{ borderColor: 'var(--border)' }}>
                  <Upload className="w-10 h-10 mx-auto" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Drop files here or <span className="font-medium" style={{ color: 'var(--color-primary)' }}>browse</span></p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>
          )}

          {isEdit && activeTab === 'salary' && (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Basic Salary (₹) <span className="text-danger ml-0.5">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-medium">₹</span>
                    <input type="number" value={basicSalary} onChange={e => setBasicSalary(Number(e.target.value))} className="input-field pl-9" required min="0" placeholder="e.g. 45000" />
                  </div>
                  <p className="text-xs text-slate-450 mt-1.5">This basic salary will be used in payroll generation and processing.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Overtime Rate (₹/hour) <span className="text-danger ml-0.5">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-medium">₹</span>
                    <input type="number" value={otRate} onChange={e => setOtRate(Number(e.target.value))} className="input-field pl-9" required min="0" placeholder="e.g. 150" />
                  </div>
                  <p className="text-xs text-slate-450 mt-1.5">The hourly rate used to calculate overtime pay for the employee.</p>
                </div>
              </div>
              {role === 'super_admin' && (
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-rose-600 mb-1">Danger Zone</h4>
                  <p className="text-xs text-slate-450 mb-3.5">Permanently delete this employee profile, attendance records, and salary details. This action cannot be undone.</p>
                  <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer">
                    <Trash2 className="w-4.5 h-4.5" /> Delete Employee
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === CREATE WIZARD STEP CONTENT === */}
          {!isEdit && step === 1 && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ name: 'name', label: 'Full Name', req: true }, { name: 'email', label: 'Email', req: true, type: 'email' }, { name: 'phone', label: 'Phone', req: true }, { name: 'dept', label: 'Department', req: true, select: true, opts: departments }, { name: 'designation', label: 'Designation', select: true, opts: designations }, { name: 'doj', label: 'Date of Joining', type: 'date' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}{f.req && <span className="text-danger ml-0.5">*</span>}</label>
                    {f.select ? (
                      <select name={f.name} value={form[f.name]} onChange={handleChange} className="input-field" required={f.req}>
                        <option value="">Select {f.label}</option>
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input name={f.name} type={f.type || 'text'} value={form[f.name]} onChange={handleChange} className="input-field" required={f.req} />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employee ID <span className="text-danger ml-0.5">*</span></label>
                  <input name="id" type="text" value={form.id} onChange={handleChange} className="input-field" required placeholder="e.g. EMP001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password <span className="text-danger ml-0.5">*</span></label>
                  <input name="password" type="text" value={form.password} onChange={handleChange} className="input-field" required placeholder="Enter password" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role / Access Level <span className="text-danger ml-0.5">*</span></label>
                  <select value={userRole} onChange={e => setUserRole(e.target.value)} className="input-field">
                    <option value="employee">Employee</option>
                    <option value="dept_manager">Department Manager</option>
                    <option value="manager">Manager</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {userRole === 'super_admin' ? 'Full access to all modules, settings, and user management.' :
                     userRole === 'hr_manager' ? 'Employee management, attendance, approvals, and reports.' :
                     userRole === 'manager' ? 'Attendance, leave approval, and shift management.' :
                     userRole === 'dept_manager' ? 'Department-level attendance and approvals.' :
                     'Personal dashboard, attendance, payslips, and self-service.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isEdit && step === 2 && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ name: 'bankName', label: 'Bank Name' }, { name: 'bankAcc', label: 'Account Number' }, { name: 'ifsc', label: 'IFSC Code' }, { name: 'uan', label: 'UAN Number' }, { name: 'esic', label: 'ESIC Number' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input name={f.name} value={form[f.name]} onChange={handleChange} className="input-field" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEdit && step === 3 && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Upload Documents</label>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all" style={{ borderColor: 'var(--border)' }}>
                  <Upload className="w-10 h-10 mx-auto" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Drop files here or <span className="font-medium" style={{ color: 'var(--color-primary)' }}>browse</span></p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>
          )}

          {!isEdit && step === 4 && (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Basic Salary (₹) <span className="text-danger ml-0.5">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-medium">₹</span>
                    <input type="number" value={basicSalary} onChange={e => setBasicSalary(Number(e.target.value))} className="input-field pl-9" required min="0" placeholder="e.g. 45000" />
                  </div>
                  <p className="text-xs text-slate-450 mt-1.5">This basic salary will be used in payroll generation and processing.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Overtime Rate (₹/hour) <span className="text-danger ml-0.5">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-medium">₹</span>
                    <input type="number" value={otRate} onChange={e => setOtRate(Number(e.target.value))} className="input-field pl-9" required min="0" placeholder="e.g. 150" />
                  </div>
                  <p className="text-xs text-slate-450 mt-1.5">The hourly rate used to calculate overtime pay for the employee.</p>
                </div>
              </div>
              <div className="mt-6 flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <input type="checkbox" id="issueJoiningKit" checked={issueJoiningKit} onChange={e => setIssueJoiningKit(e.target.checked)} className="accent-primary w-4.5 h-4.5 cursor-pointer mt-0.5" />
                <div>
                  <label htmlFor="issueJoiningKit" className="text-sm font-bold block cursor-pointer" style={{ color: 'var(--text-primary)' }}>Issue Mandatory Joining Kit (Uniform Dress & Helmet)</label>
                  <span className="text-xs block text-slate-500 mt-1">Cost of ₹2,400 will be automatically deducted over 12 months (₹200/month) starting from their first salary.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/app/employees')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4" />
            {isEdit ? 'Update Employee' : isLastStep ? 'Save & Complete' : 'Save & Next'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EmployeeForm
