import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, User, Briefcase, Landmark, Phone, FileText, Package, Clock, DollarSign, Mail, MapPin, Calendar, Building, Shield, CheckCircle, ChevronRight, CalendarDays, Sun, Moon, Star } from 'lucide-react'
import { useTheme } from '../../lib/ThemeContext'
import { getEmployee, getEmployeeSalary } from '../../lib/db'

const profileTabs = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'bank', label: 'Bank & Statutory', icon: Landmark, roleLimit: 'super_admin' },
  { id: 'emergency', label: 'Emergency', icon: Phone },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'salary', label: 'Salary', icon: DollarSign, roleLimit: 'super_admin' },
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'payroll', label: 'Payroll', icon: FileText, roleLimit: 'super_admin' },
]

function EmployeeView() {
  const { role } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('personal')
  const [employee, setEmployee] = useState(null)
  const [salary, setSalary] = useState(null)
  const [perDay, setPerDay] = useState(0)
  const [otAmount, setOtAmount] = useState(0)

  useEffect(() => {
    if (!id) return
    getEmployee(id).then(data => {
      if (data) {
        const mapped = { ...data, id: data.employee_id }
        setEmployee(mapped)
        const pd = mapped.perDay || Math.round((mapped.basic || 0) / 22)
        setPerDay(pd)
        setOtAmount(mapped.otAmount || 0)
      }
    }).catch(err => console.error('Failed to load employee:', err))

    getEmployeeSalary(id).then(data => {
      if (data) {
        setSalary(data)
        if (data.perDay) setPerDay(data.perDay)
        if (data.otAmount) setOtAmount(data.otAmount)
      }
    }).catch(err => console.error('Failed to load salary data:', err))
  }, [id])

  const workingDays = 22
  const calculatedBasic = perDay * workingDays
  const grossPayable = calculatedBasic + otAmount

  const displayEmp = employee || { id: id || '—', name: 'Loading...', email: '—', phone: '—', dept: '—', designation: '—', doj: '—', status: 'Active', bankName: '—', bankAcc: '—', ifsc: '—', uan: '—', esic: '—', address: '—' }
  const emp = employee || displayEmp
  const empSalary = salary || {}
  const shift = empSalary?.shift || employee?.shift || ''
  const monthlyHours = empSalary?.monthlyHrs || employee?.monthlyHours || 0
  const otHours = empSalary?.otHrs || employee?.otHours || 0
  const basic = empSalary?.basic || employee?.basic || 0
  const visibleTabs = profileTabs.filter(t => !t.roleLimit || role === t.roleLimit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/employees')} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{displayEmp.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{displayEmp.id} · {displayEmp.dept} · {displayEmp.designation}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`badge ${displayEmp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{displayEmp.status}</span>
          <button onClick={() => navigate(`/app/employees/${id}/edit`)} className="btn-secondary text-xs">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
              {displayEmp.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>{displayEmp.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{displayEmp.designation}</p>
            <div className="mt-4 space-y-2.5 text-sm text-left">
              {[
                { icon: Mail, value: displayEmp.email },
                { icon: Phone, value: displayEmp.phone },
                { icon: MapPin, value: displayEmp.address },
                { icon: Calendar, value: `Joined ${displayEmp.doj}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }} className="truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 mt-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>QUICK LINKS</div>
            {role === 'super_admin' && (
              <button onClick={() => navigate('/app/payroll')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors"
                style={{ color: 'var(--text-secondary)' }}>
                <DollarSign className="w-4 h-4" /> View Payslips <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            )}
            {[
              { label: 'Request Leave', icon: CalendarDays, to: '/app/attendance/leave/request' },
              { label: 'Attendance Log', icon: Clock, to: '/app/attendance' },
            ].map((link, i) => {
              const Icon = link.icon
              return (
                <button key={i} onClick={() => navigate(link.to)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  <Icon className="w-4 h-4" /> {link.label} <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex flex-wrap p-1 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
              {visibleTabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`tab-btn whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}>
                    <Icon className="w-4 h-4 inline mr-1.5" />{tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6 animate-fade-in">
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name', value: displayEmp.name },
                    { label: 'Email Address', value: displayEmp.email },
                    { label: 'Phone Number', value: displayEmp.phone },
                    { label: 'Date of Birth', value: emp?.dob || '--' },
                    { label: 'Gender', value: emp?.gender || '--' },
                    { label: 'Blood Group', value: emp?.blood_group || '--' },
                    { label: 'Marital Status', value: emp?.marital_status || '--' },
                    { label: 'Address', value: displayEmp.address, full: true },
                  ].map((f, i) => (
                    <div key={i} className={f.full ? 'md:col-span-2' : ''}>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Employee ID', value: displayEmp.id },
                    { label: 'Department', value: displayEmp.dept },
                    { label: 'Designation', value: displayEmp.designation },
                    { label: 'Date of Joining', value: displayEmp.doj },
                    { label: 'Probation Period', value: emp?.probation || '--' },
                    { label: 'Employment Type', value: emp?.employment_type || '--' },
                    { label: 'Reporting Manager', value: emp?.reporting_manager || '--' },
                    { label: 'Work Location', value: emp?.work_location || '--' },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Bank Name', value: displayEmp.bankName },
                    { label: 'Account Number', value: displayEmp.bankAcc },
                    { label: 'IFSC Code', value: displayEmp.ifsc },
                    { label: 'UAN Number', value: displayEmp.uan },
                    { label: 'ESIC Number', value: displayEmp.esic },
                    { label: 'PAN Card', value: emp?.pan || '--' },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-primary)' }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'emergency' && (
                <div>
                  {emp?.emergency_contacts && emp.emergency_contacts.length > 0 ? (
                    emp.emergency_contacts.map((c, i) => (
                      <div key={i} className="card p-4 mb-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--hover)' }}>
                          <Phone className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.relation} · {c.phone}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No emergency contacts available</p>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  {emp?.documents && emp.documents.length > 0 ? (
                    emp.documents.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.file} · {d.size}</div>
                          </div>
                        </div>
                        <button onClick={() => alert('Document download coming soon')} className="btn-secondary text-xs py-1.5 px-3">Download</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No documents uploaded</p>
                  )}
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header"><th>Asset</th><th>Code</th><th>Issue Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {(emp.assets || []).map((a, i) => (
                        <tr key={i} className="table-row">
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.code}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.date}</td>
                          <td className="px-4 py-3"><span className="badge badge-success">{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header"><th>Month</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr></thead>
                    <tbody>
                      {(emp.attendance || []).map((a, i) => (
                        <tr key={i} className="table-row">
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.month}</td>
                          <td className="px-4 py-3" style={{ color: '#4CAF50' }}>{a.present}</td>
                          <td className="px-4 py-3" style={{ color: '#1A78C2' }}>{a.absent}</td>
                          <td className="px-4 py-3" style={{ color: '#4CAF50' }}>{a.late}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{Math.round(a.present / (a.present + a.absent + a.late) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'salary' && role === 'super_admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="card p-5 space-y-4" style={{ border: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Salary Overview</h3>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Employee ID</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayEmp.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Working Days / Month</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{workingDays} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Per Day Rate (₹)</span>
                      <input type="number" value={perDay} onChange={e => setPerDay(Number(e.target.value))}
                        className="w-full max-w-28 text-right px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Basic Salary</span>
                      <span className="text-lg font-bold" style={{ color: '#1A78C2' }}>₹{calculatedBasic.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monthly Working Hours</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{monthlyHours} hrs</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5">
                      <span style={{ color: 'var(--text-muted)' }}>Shift</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{shift}</span>
                    </div>
                  </div>
                  <div className="card p-5 space-y-4" style={{ border: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overtime & Earnings</h3>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>OT Hours (This Month)</span>
                      <span className="font-medium" style={{ color: '#4CAF50' }}>{otHours} hrs</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>OT Amount (₹)</span>
                      <input type="number" value={otAmount} onChange={e => setOtAmount(Number(e.target.value))}
                        className="w-full max-w-28 text-right px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="flex items-center justify-between text-sm py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gross Payable</span>
                      <span className="text-lg font-bold" style={{ color: '#4CAF50' }}>₹{grossPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {shift === 'Morning' ? <Sun className="w-4 h-4" style={{ color: '#4CAF50' }} /> :
                       shift === 'Evening' ? <Star className="w-4 h-4" style={{ color: '#1A78C2' }} /> :
                       <Moon className="w-4 h-4" style={{ color: '#1A78C2' }} />}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{shift} Shift</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && role === 'super_admin' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header"><th>Month</th><th>Gross</th><th>Net Pay</th><th>Actions</th></tr></thead>
                    <tbody>
                      {(emp.payroll || []).map((p, i) => (
                        <tr key={i} className="table-row">
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{p.month}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>₹{p.gross.toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: '#4CAF50' }}>₹{p.net.toLocaleString()}</td>
                          <td className="px-4 py-3"><button onClick={() => alert('Payslip download coming soon')} className="btn-secondary text-xs py-1.5 px-3">Payslip</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeView
