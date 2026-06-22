import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/ThemeContext'
import { useAuth } from '../../lib/AuthContext'
import { ArrowLeft, Clock, LogIn, LogOut, CheckCircle, Sun, Moon, Star, Timer, ShieldCheck, ArrowRight, User, Building2, Calendar, Play, Square, Mail, KeyRound, Eye, EyeOff, ChevronLeft, Users, Search, BarChart3, Activity, UserCheck, UserX, AlertTriangle, Download, FileSpreadsheet, HardHat, Bell } from 'lucide-react'
import { getEmployees, getEmployeeSession, startEmployeeSession, endEmployeeSession, getDepartments, getTodayAttendance, getEmployeeNotifications, markNotificationRead } from '../../lib/db'

function getShift() {
  const h = new Date().getHours()
  if (h >= 6 && h < 14) return { name: 'Morning', icon: Sun, color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', time: '06:00 - 14:00', gradient: 'linear-gradient(135deg, #4CAF50, #388E3C)' }
  if (h >= 14 && h < 22) return { name: 'Evening', icon: Star, color: 'var(--color-primary)', bg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', time: '14:00 - 22:00', gradient: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }
  return { name: 'Night', icon: Moon, color: '#1A78C2', bg: 'rgba(26,120,194,0.12)', time: '22:00 - 06:00', gradient: 'linear-gradient(135deg, #1A78C2, #0D4F7A)' }
}

const monthsList = [
  { name: 'January', value: 0 }, { name: 'February', value: 1 }, { name: 'March', value: 2 },
  { name: 'April', value: 3 }, { name: 'May', value: 4 }, { name: 'June', value: 5 },
  { name: 'July', value: 6 }, { name: 'August', value: 7 }, { name: 'September', value: 8 },
  { name: 'October', value: 9 }, { name: 'November', value: 10 }, { name: 'December', value: 11 }
];
const currentYear = new Date().getFullYear();
const yearsList = Array.from({length: 7}, (_, i) => currentYear - 5 + i);

  const emptyLog = (date) => ({
    date: `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`,
    dayName: date.toLocaleDateString('en-IN',{weekday:'short'}),
    dateNum: date.getDate(),
    monthName: date.toLocaleDateString('en-IN',{month:'short'}),
    status: '--', checkIn: '--', checkOut: '--', breakTime: '0m', workingHours: '0h', tasks: [],
    isToday: false, isFuture: true
  });

  const getRealLog = (date, checkInTime, checkOutTime, step) => {
    const today = new Date();
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateStr = `${String(compareDate.getDate()).padStart(2,'0')}-${String(compareDate.getMonth()+1).padStart(2,'0')}-${compareDate.getFullYear()}`;
    const isToday = compareDate.getTime() === todayMidnight.getTime();
    const isFuture = compareDate.getTime() > todayMidnight.getTime();
    const base = { date: dateStr, dayName: date.toLocaleDateString('en-IN',{weekday:'short'}), dateNum: date.getDate(), monthName: date.toLocaleDateString('en-IN',{month:'short'}), isToday, isFuture };
    if (isFuture) return { ...base, status: 'Scheduled', checkIn: '--', checkOut: '--', breakTime: '0m', workingHours: '0h', tasks: [] };
    if (isToday) {
      if (step === 'dashboard') return { ...base, status: 'Absent', checkIn: '--', checkOut: '--', breakTime: '0m', workingHours: '0h', tasks: [] };
      if (step === 'working') {
        const ci = checkInTime ? checkInTime.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false}) : '--';
        const et = checkInTime ? Math.floor((Date.now()-checkInTime)/1000) : 0;
        return { ...base, status: 'Present', checkIn: ci, checkOut: '--', breakTime: '0m', workingHours: `${Math.floor(et/3600)}h ${Math.floor((et%3600)/60)}m`, tasks: [] };
      }
      if (step === 'completed') {
        const ci = checkInTime ? checkInTime.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false}) : '--';
        const co = checkOutTime ? checkOutTime.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false}) : '--';
        const et = checkInTime&&checkOutTime ? Math.floor((checkOutTime-checkInTime)/1000) : 0;
        return { ...base, status: 'Present', checkIn: ci, checkOut: co, breakTime: '0m', workingHours: `${Math.floor(et/3600)}h ${Math.floor((et%3600)/60)}m`, tasks: [] };
      }
      return { ...base, status: '--', checkIn: '--', checkOut: '--', breakTime: '0m', workingHours: '0h', tasks: [] };
    }
    return { ...base, status: '--', checkIn: '--', checkOut: '--', breakTime: '0m', workingHours: '0h', tasks: [] };
  };

const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= numDays; i++) days.push(new Date(year, month, i));
  return days;
};

function EmployeeDashboard() {
  const navigate = useNavigate()
  const { role } = useTheme()
  const { user } = useAuth()
  const isAdmin = !!(user && (user.role === 'super_admin' || user.role === 'hr_manager' || user.role === 'manager' || user.role === 'dept_manager'))

  const [employeesData, setEmployeesData] = useState([])
  const [step, setStep] = useState('login')
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [emp, setEmp] = useState(null)
  const [error, setError] = useState('')
  const [checkInTime, setCheckInTime] = useState(null)
  const [checkOutTime, setCheckOutTime] = useState(null)
  const [now, setNow] = useState(new Date())
  const [animIn, setAnimIn] = useState(false)
  const [adminView, setAdminView] = useState('list')
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})
  const [nameSearch, setNameSearch] = useState('')
  const [idSearch, setIdSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [viewMode, setViewMode] = useState('week')
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date())
  const [employeeNotifications, setEmployeeNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const employeeUnread = employeeNotifications.filter(n => !n.read).length

  const loadSession = (employeeId) => {
    const saved = localStorage.getItem('session_' + employeeId)
    if (saved) {
      try {
        const s = JSON.parse(saved)
        if (s.check_in) setCheckInTime(new Date(s.check_in))
        if (s.check_out) setCheckOutTime(new Date(s.check_out))
        if (s.check_out) setStep('completed')
        else if (s.check_in) setStep('working')
        else setStep('dashboard')
        return true
      } catch (e) { /* ignore corrupt data */ }
    }
    return false
  }

  useEffect(() => {
    getEmployees().then(data => {
      setEmployeesData((data || []).map(e => ({ ...e, id: e.employee_id })))
    }).catch(err => console.error('Failed to load employees:', err))
  }, [])

  useEffect(() => {
    const savedId = localStorage.getItem('current_emp_id')
    if (savedId && employeesData.length > 0) {
      const foundEmp = employeesData.find(e => e.id === savedId)
      if (foundEmp) {
        setEmp(foundEmp)
        if (loadSession(savedId)) return
        getEmployeeSession(savedId).then(session => {
          if (session) {
            localStorage.setItem('session_' + savedId, JSON.stringify(session))
            if (session.check_in) setCheckInTime(new Date(session.check_in))
            if (session.check_out) setCheckOutTime(new Date(session.check_out))
            if (session.check_out) setStep('completed')
            else if (session.check_in) setStep('working')
            else setStep('dashboard')
          }
        }).catch(err => console.error('Failed to load employee session:', err))
      }
    } else if (user && !isAdmin && employeesData.length > 0) {
      const foundEmp = employeesData.find(e => e.email?.toLowerCase() === user.email?.toLowerCase())
      if (foundEmp) {
        setEmp(foundEmp)
        localStorage.setItem('current_emp_id', foundEmp.id)
        if (loadSession(foundEmp.id)) return
        getEmployeeSession(foundEmp.id).then(session => {
          if (session) {
            localStorage.setItem('session_' + foundEmp.id, JSON.stringify(session))
            if (session.check_in) setCheckInTime(new Date(session.check_in))
            if (session.check_out) setCheckOutTime(new Date(session.check_out))
            if (session.check_out) setStep('completed')
            else if (session.check_in) setStep('working')
            else setStep('dashboard')
          }
        }).catch(() => {})
      }
    }
    setTimeout(() => setAnimIn(true), 50)
  }, [employeesData, user])

  useEffect(() => {
    if (isAdmin && employeesData.length > 0) {
      getTodayAttendance().then(data => {
        const logs = (data || []).map(a => {
          const emp = employeesData.find(e => e.id === a.employee_id)
          const ci = a.check_in || '--'
          const co = a.check_out || '--'
          const dateStr = a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN') : '--'
          const hours = ci !== '--' && co !== '--'
            ? Math.floor((new Date(`1970-01-01T${co}`) - new Date(`1970-01-01T${ci}`)) / 3600000) + 'h'
            : '--'
          return {
            date: dateStr,
            name: emp?.name || 'Unknown',
            id: a.employee_id,
            in: ci,
            out: co,
            hours,
            ot: '0h',
            status: a.status || (a.check_in ? 'Present' : 'Absent'),
          }
        })
        setAttendanceLogs(logs)
      }).catch(() => {})
    }
  }, [isAdmin, employeesData])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { setAnimIn(false); setTimeout(() => setAnimIn(true), 50) }, [step])

  useEffect(() => {
    if (emp) {
      const weekLogs = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
          weekLogs.push(getRealLog(d, checkInTime, checkOutTime, step));
      }
      setWeeklyLogs(weekLogs);

      if (!selectedLog) {
        const todayLog = weekLogs.find(l => l.isToday);
        setSelectedLog(todayLog || weekLogs[weekLogs.length - 1]);
      } else {
        const parts = selectedLog.date.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          setSelectedLog(getRealLog(dateObj, checkInTime, checkOutTime, step));
        }
      }
    } else {
      setWeeklyLogs([]);
      setSelectedLog(null);
    }
  }, [emp, step, checkInTime, checkOutTime])

  useEffect(() => {
    if (emp?.id) {
      getEmployeeNotifications(emp.id).then(setEmployeeNotifications).catch(() => {})
    }
  }, [emp?.id])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleEmployeeNotifClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {})
      setEmployeeNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
  }

  const shift = getShift()
  const ShiftIcon = shift.icon

  const saveSession = (id, data) => {
    localStorage.setItem('session_' + id, JSON.stringify(data))
  }

  const clearSession = (id) => {
    localStorage.removeItem('session_' + id)
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setError('')
    const found = employeesData.find(e => e.id.toLowerCase() === empId.trim().toLowerCase() && e.password === password)
    if (!found) { setError('Invalid ID or password'); return }
    setEmp(found)
    localStorage.setItem('current_emp_id', found.id)

    if (loadSession(found.id)) return

    try {
      const session = await getEmployeeSession(found.id)
      if (session) {
        saveSession(found.id, session)
        if (session.check_in) setCheckInTime(new Date(session.check_in))
        if (session.check_out) setCheckOutTime(new Date(session.check_out))
        if (session.check_out) { setStep('completed'); return }
        if (session.check_in) { setStep('working'); return }
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }

    setStep('dashboard')
  }

  const handleCheckIn = async () => {
    const now = new Date()
    try {
      const data = await startEmployeeSession(emp.id)
      const ci = new Date(data.check_in)
      setCheckInTime(ci)
      setStep('working')
      saveSession(emp.id, { check_in: ci.toISOString(), check_out: null, status: 'active' })
    } catch (err) {
      console.error('Failed to check in via DB, using local:', err)
      setCheckInTime(now)
      setStep('working')
      saveSession(emp.id, { check_in: now.toISOString(), check_out: null, status: 'active' })
    }
  }

  const handleCheckOut = async () => {
    const now = new Date()
    try {
      const data = await endEmployeeSession(emp.id)
      const co = new Date(data.check_out)
      setCheckOutTime(co)
      setStep('completed')
      const ci = checkInTime || now
      saveSession(emp.id, { check_in: ci.toISOString(), check_out: co.toISOString(), status: 'completed' })
    } catch (err) {
      console.error('Failed to check out via DB, using local:', err)
      setCheckOutTime(now)
      setStep('completed')
      const ci = checkInTime || now
      saveSession(emp.id, { check_in: ci.toISOString(), check_out: now.toISOString(), status: 'completed' })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('current_emp_id')
    setStep('login'); setEmpId(''); setPassword(''); setEmp(null)
    setCheckInTime(null); setCheckOutTime(null);
    if (isAdmin) setAdminView('list')
  }

  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmt12 = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const fdate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })

  const elapsed = checkInTime ? Math.floor(((checkOutTime || now) - checkInTime) / 1000) : 0
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const totalMin = Math.floor(elapsed / 60)
  const totalHrs = (elapsed / 3600).toFixed(1)

  if (isAdmin && (adminView === 'list' || selectedEmp)) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {selectedEmp ? (
            <AdminEmployeeDetail
              emp={selectedEmp}
              logs={attendanceLogs.filter(l => l.id === selectedEmp.id)}
              onBack={() => setSelectedEmp(null)}
            />
          ) : (
            <AdminEmployeeList
              role={role}
              employees={employeesData}
              dailyLogs={attendanceLogs}
              showPasswords={showPasswords}
              nameSearch={nameSearch}
              setNameSearch={setNameSearch}
              idSearch={idSearch}
              setIdSearch={setIdSearch}
              deptFilter={deptFilter}
              setDeptFilter={setDeptFilter}
              onTogglePassword={(email) => setShowPasswords(p => ({ ...p, [email]: !p[email] }))}
              onSelectEmployee={(emp) => setSelectedEmp(emp)}
              onLoginAsEmployee={async (empToLogin) => {
                setEmp(empToLogin)
                localStorage.setItem('current_emp_id', empToLogin.id)

                if (loadSession(empToLogin.id)) { setAdminView('impersonate'); return }

                try {
                  const session = await getEmployeeSession(empToLogin.id)
                  if (session) {
                    saveSession(empToLogin.id, session)
                    if (session.check_in) setCheckInTime(new Date(session.check_in))
                    if (session.check_out) setCheckOutTime(new Date(session.check_out))
                    if (session.check_out) setStep('completed')
                    else if (session.check_in) setStep('working')
                    else setStep('dashboard')
                    setAdminView('impersonate')
                    return
                  }
                } catch (err) {
                  console.error('Failed to load session:', err)
                }

                setStep('dashboard')
                setAdminView('impersonate')
              }}
            />
          )}
        </div>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #E3F0FA 0%, #E8F5E9 100%)' }}>
        <div className="w-full p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #0D4F7A, #1A78C2)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10 mr-1"
                title="Back to Landing Page">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg text-white">Employee Logings</div>
                <div className="text-xs text-white/70">Sign in to track your attendance</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <ShiftIcon className="w-4 h-4" style={{ color: shift.color }} />
              <span className="text-white text-sm font-medium">{shift.name} Shift</span>
              <span className="text-white/60 text-xs">{shift.time}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-slide-up">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm p-3.5 rounded-2xl animate-fade-in"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary-dark)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
                  <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Employee ID</label>
                <input type="text" value={empId} onChange={e => setEmpId(e.target.value)}
                  className="input-field pl-4"
                  style={{ background: '#fff', border: '2px solid #e2e8f0', color: '#0f172a' }}
                  onFocus={e => e.target.style.borderColor = '#1A78C2'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="e.g. EMP001" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-4"
                  style={{ background: '#fff', border: '2px solid #e2e8f0', color: '#0f172a' }}
                  onFocus={e => e.target.style.borderColor = '#1A78C2'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="Enter your password" required />
              </div>
              <button type="submit"
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{ background: '#1A78C2' }}
                onMouseEnter={e => e.target.style.background = '#1565A3'}
                onMouseLeave={e => e.target.style.background = '#1A78C2'}>
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            </form>
            <div className="mt-6 p-4 rounded-2xl text-center" style={{ background: '#E3F0FA' }}>
              <div className="text-xs font-semibold" style={{ color: '#1A78C2' }}>Registered Employees</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{employeesData.length} employees loaded from database</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Use your Employee ID and password to sign in</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)' }}>
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10"
        style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => setAdminView('list')} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-100 mr-1" style={{ color: '#64748b' }} title="Back to Admin List">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
          </div>
          <span className="font-bold text-lg" style={{ color: '#0f172a' }}>Devna Engineers</span>
          {isAdmin && (
            <span className="ml-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-widest" style={{ border: '1px solid rgba(217, 119, 6, 0.2)' }}>
              Impersonating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-xl transition-colors hover:bg-slate-100" style={{ color: '#64748b' }}>
              <Bell className="w-5 h-5" />
              {employeeUnread > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{employeeUnread}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl shadow-lg border z-50 overflow-hidden animate-scale-in"
                style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#e2e8f0' }}>
                  <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Notifications</div>
                </div>
                {employeeNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: '#94a3b8' }}>No notifications yet</div>
                ) : employeeNotifications.slice(0, 5).map((n, i) => (
                  <div key={n.id || i} onClick={() => handleEmployeeNotifClick(n)}
                    className="px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer"
                    style={{ borderColor: '#e2e8f0', opacity: n.read ? 0.6 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="text-sm" style={{ color: '#0f172a' }}>{n.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Just now'}
                      {!n.read && <span className="ml-2 w-1.5 h-1.5 bg-sky-600 rounded-full inline-block" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-slate-50"
            style={{ color: '#64748b', border: '1px solid #e2e8f0' }}>
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className={'w-full max-w-5xl transition-all duration-500 ' + (animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8') + ' flex flex-col gap-6'}>
          
          {emp && (
            <div className="card p-6 rounded-3xl animate-scale-in" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
              
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800">Attendance Calendar</h3>
                    <p className="text-xs text-slate-400">Track working hours, breaks, and tasks</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {viewMode === 'month' && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button 
                        onClick={() => { const prev = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1); setCurrentMonthDate(prev); }}
                        className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-600 flex items-center justify-center w-6 h-6"
                        title="Previous Month"
                      ><ChevronLeft className="w-4 h-4" /></button>
                      <select 
                        value={currentMonthDate.getMonth()}
                        onChange={(e) => { const val = parseInt(e.target.value); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), val, 1)); }}
                        className="text-xs font-bold text-slate-700 bg-transparent outline-none border-none py-1 px-1 cursor-pointer focus:ring-0"
                      >
                        {monthsList.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
                      </select>
                      <select 
                        value={currentMonthDate.getFullYear()}
                        onChange={(e) => { const val = parseInt(e.target.value); setCurrentMonthDate(new Date(val, currentMonthDate.getMonth(), 1)); }}
                        className="text-xs font-bold text-slate-700 bg-transparent outline-none border-none py-1 px-1 cursor-pointer focus:ring-0"
                      >
                        {yearsList.map(y => (<option key={y} value={y}>{y}</option>))}
                      </select>
                      <button 
                        onClick={() => { const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1); setCurrentMonthDate(next); }}
                        className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-600 flex items-center justify-center w-6 h-6"
                        title="Next Month"
                      ><ArrowRight className="w-4 h-4" /></button>
                    </div>
                  )}

                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button onClick={() => setViewMode('week')}
                      className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (viewMode === 'week' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                      Week View
                    </button>
                    <button onClick={() => setViewMode('month')}
                      className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (viewMode === 'month' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                      Month View
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'month' ? (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<span key={d} className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</span>))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                    {getMonthDays(currentMonthDate.getFullYear(), currentMonthDate.getMonth()).map((dayDate, idx) => {
                      if (!dayDate) return <div key={'empty-' + idx} className="bg-slate-50/30 rounded-2xl border border-dashed border-slate-100 min-h-[65px]" />;
                      const log = getRealLog(dayDate, checkInTime, checkOutTime, step);
                      const isSelected = selectedLog && selectedLog.date === log.date;
                      return (
                        <button key={log.date} disabled={log.isFuture} onClick={() => setSelectedLog(log)}
                          className={'relative p-2 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 ' + (log.isFuture ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : isSelected ? 'scale-103 shadow-md border-2 font-semibold' : 'hover:scale-102 hover:shadow-xs border cursor-pointer')}
                          style={{ background: isSelected ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#fff', borderColor: isSelected ? '#1A78C2' : '#e2e8f0', minHeight: '65px' }}>
                          {log.isToday && <span className="absolute -top-2 px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white bg-sky-600 uppercase tracking-wider scale-75">Today</span>}
                          <span className={'text-xs md:text-sm font-extrabold ' + (isSelected ? 'text-sky-800' : 'text-slate-700')}>{log.dateNum}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={'w-1.5 h-1.5 rounded-full shrink-0 ' + (log.isFuture ? 'bg-slate-305' : log.status === 'Present' ? 'bg-emerald-500' : log.status === 'Late' ? 'bg-amber-500' : log.status === 'Absent' ? 'bg-rose-500' : 'bg-slate-400')} />
                            <span className="hidden md:inline text-[8px] font-bold text-slate-550 uppercase tracking-wide">{log.status === 'Weekly Off' ? 'Off' : log.status === 'Scheduled' ? '--' : log.status}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5 md:gap-3 animate-fade-in">
                  {weeklyLogs.map((log) => {
                    const isSelected = selectedLog && selectedLog.date === log.date;
                    return (
                      <button key={log.date} onClick={() => setSelectedLog(log)}
                        className={'relative p-2.5 md:p-3.5 rounded-2xl flex flex-col items-center justify-between transition-all duration-300 cursor-pointer ' + (isSelected ? 'scale-105 shadow-md border-2 font-semibold' : 'hover:scale-102 hover:shadow-sm border')}
                        style={{ background: isSelected ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : '#fff', borderColor: isSelected ? '#1A78C2' : '#e2e8f0', minHeight: '95px' }}>
                        {log.isToday && <span className="absolute -top-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white bg-sky-600 uppercase tracking-wider scale-90">Today</span>}
                        <span className="text-[9px] md:text-xs font-semibold tracking-wide text-slate-400 uppercase">{log.dayName}</span>
                        <span className={'text-sm md:text-lg font-extrabold my-1 ' + (isSelected ? 'text-sky-850' : 'text-slate-700')}>{log.dateNum}</span>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 w-full mt-0.5">
                          <span className={'w-2 h-2 rounded-full shrink-0 ' + (log.status === 'Present' ? 'bg-emerald-500 animate-pulse-dot' : log.status === 'Late' ? 'bg-amber-500' : log.status === 'Absent' ? 'bg-rose-500' : 'bg-slate-450')} />
                          <span className="hidden md:inline text-[9px] font-bold text-slate-500 tracking-wide">{log.status === 'Weekly Off' ? 'Off' : log.status}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedLog && (
                <div key={selectedLog.date} className="mt-6 pt-5 border-t border-slate-100 animate-slide-up flex flex-col md:flex-row gap-5 items-stretch">
                  <div className="md:w-1/4 flex flex-col justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Day</h4>
                    <div className="text-sm font-extrabold text-slate-800 mt-1">{selectedLog.dayName}, {selectedLog.dateNum} {selectedLog.monthName}</div>
                    <div className="mt-3 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
                        style={{ background: selectedLog.status === 'Present' ? '#f0fdf4' : selectedLog.status === 'Late' ? '#fffbeb' : selectedLog.status === 'Absent' ? '#fef2f2' : selectedLog.status === 'Scheduled' ? '#eff6ff' : '#f1f5f9', color: selectedLog.status === 'Present' ? '#166534' : selectedLog.status === 'Late' ? '#92400e' : selectedLog.status === 'Absent' ? '#991b1b' : selectedLog.status === 'Scheduled' ? '#1e40af' : '#475569', borderColor: selectedLog.status === 'Present' ? '#bbf7d0' : selectedLog.status === 'Late' ? '#fde68a' : selectedLog.status === 'Absent' ? '#fecaca' : selectedLog.status === 'Scheduled' ? '#bfdbfe' : '#cbd5e1' }}>
                        <span className={'w-1.5 h-1.5 rounded-full ' + (selectedLog.status === 'Present' ? 'bg-emerald-500' : selectedLog.status === 'Late' ? 'bg-amber-500' : selectedLog.status === 'Absent' ? 'bg-rose-500' : selectedLog.status === 'Scheduled' ? 'bg-blue-500' : 'bg-slate-500')} />
                        {selectedLog.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 mt-3 leading-relaxed">
                      {selectedLog.status === 'Weekly Off' ? 'Weekly rest day. No shifts scheduled.' : selectedLog.status === 'Absent' ? 'No attendance clocked for today.' : selectedLog.status === 'Late' ? 'Late check-in recorded on this day.' : selectedLog.status === 'Scheduled' ? 'Future shift slot scheduled.' : 'Regular workday shift details.'}
                    </p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><LogIn className="w-4.5 h-4.5 text-emerald-500" /></div>
                      <div><div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Check In</div><div className="text-xs font-bold text-slate-700 mt-0.5">{selectedLog.checkIn !== '--' ? selectedLog.checkIn + ' AM' : '--'}</div></div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0"><LogOut className="w-4.5 h-4.5 text-sky-600" /></div>
                      <div><div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Check Out</div><div className="text-xs font-bold text-slate-700 mt-0.5">{selectedLog.checkOut !== '--' ? selectedLog.checkOut + ' PM' : '--'}</div></div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Clock className="w-4.5 h-4.5 text-emerald-600" /></div>
                      <div><div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Working Hours</div><div className="text-xs font-bold text-slate-700 mt-0.5">{selectedLog.workingHours}</div></div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Timer className="w-4.5 h-4.5 text-amber-500" /></div>
                      <div><div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Break Duration</div><div className="text-xs font-bold text-slate-700 mt-0.5">{selectedLog.breakTime}</div></div>
                    </div>
                  </div>
                  <div className="md:w-1/3 p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Tasks & Activities</h4>
                      <div className="space-y-2 overflow-y-auto max-h-[95px] pr-1">
                        {selectedLog.tasks && selectedLog.tasks.length > 0 ? selectedLog.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-650 bg-white p-1.5 rounded-lg border border-slate-100">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </div>
                        )) : (
                          <div className="text-center py-4 text-xs text-slate-400 font-medium">{selectedLog.status === 'Weekly Off' ? 'Rest Day - No tasks' : 'No tasks recorded'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-12 gap-6 items-stretch">

            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="flex-1 p-6 rounded-3xl flex flex-col items-center text-center relative overflow-hidden"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: shift.gradient }} />
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white mb-5 mt-4 shadow-lg shrink-0"
                  style={{ background: shift.gradient, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h2 className="font-bold text-2xl" style={{ color: '#0f172a' }}>{emp.name}</h2>
                <p className="text-xs font-semibold tracking-wider text-slate-400 mt-1 mb-6 uppercase">{emp.id}</p>
                <div className="w-full border-t border-slate-100 pt-5 mt-auto space-y-4 text-left text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Department</span>
                    <span className="font-semibold flex items-center gap-1.5 text-slate-700"><Building2 className="w-4 h-4 text-slate-400" /> {emp.dept}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Active Shift</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: shift.bg, color: shift.color }}>
                      <ShiftIcon className="w-3.5 h-3.5" /> {shift.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Shift Time</span>
                    <span className="font-semibold text-slate-700">{shift.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Email Address</span>
                    <span className="font-semibold text-slate-600 text-xs truncate max-w-[170px]" title={emp.email}>{emp.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(26,120,194,0.06)', border: '1px solid rgba(26,120,194,0.15)' }}>
                <Timer className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#1A78C2' }} />
                <div className="text-xs leading-relaxed text-slate-500">
                  <strong>Session saved</strong> — you can safely close this page. Your time continues tracking even after logout.
                </div>
              </div>
            </div>

            <div className="md:col-span-7 flex">
              <div className="w-full p-8 md:p-10 rounded-3xl text-center relative overflow-hidden flex flex-col justify-center items-center"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', minHeight: '420px' }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: shift.gradient }} />
                
                {step === 'dashboard' && (
                  <div className="space-y-6 animate-scale-in w-full">
                    <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #E3F0FA 0%, #E8F5E9 100%)', boxShadow: '0 0 0 4px rgba(26,120,194,0.08)' }}>
                      <Play className="w-10 h-10 ml-1" style={{ color: '#4CAF50' }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Ready to Start?</h2>
                      <p className="text-sm mt-1.5 text-slate-500">Your {shift.name.toLowerCase()} shift begins now</p>
                    </div>
                    <button onClick={handleCheckIn}
                      className="inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #4CAF50, #388E3C)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(76,175,80,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(76,175,80,0.3)'; }}>
                      <LogIn className="w-5 h-5" /> Check In — Start Shift
                    </button>
                  </div>
                )}

                {step === 'working' && (
                  <div className="space-y-6 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <span className="relative flex w-2.5 h-2.5">
                        <span className="animate-ping absolute inset-0 rounded-full" style={{ background: '#4CAF50' }} />
                        <span className="relative rounded-full w-2.5 h-2.5" style={{ background: '#4CAF50' }} />
                      </span>
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#4CAF50' }}>Working Now</span>
                    </div>
                    <div className="relative">
                      <div className="text-6xl md:text-7xl font-extrabold tracking-wider tabular-nums text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {hh}:{mm}:{ss}
                      </div>
                      <div className="flex justify-center gap-6 mt-3 text-xs font-medium text-slate-400">
                        <span>{totalMin} mins elapsed</span>
                        <span>{totalHrs} hrs</span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 py-2">
                      <div className="text-center px-5 py-3 rounded-2xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', minWidth: '120px' }}>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Check In</div>
                        <div className="text-base font-bold mt-0.5 text-slate-700">{fmt12(checkInTime)}</div>
                      </div>
                      <div className="text-center px-5 py-3 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', minWidth: '120px' }}>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Expected Out</div>
                        <div className="text-base font-bold mt-0.5 text-slate-700">
                          {shift.name === 'Morning' ? '02:00 PM' : shift.name === 'Evening' ? '10:00 PM' : '06:00 AM'}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleCheckOut}
                      className="inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #1A78C2, #0D4F7A)' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,120,194,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,120,194,0.3)'; }}>
                      <Square className="w-5 h-5" /> Check Out — End Shift
                    </button>
                  </div>
                )}

                {step === 'completed' && (
                  <div className="space-y-6 w-full">
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', boxShadow: '0 0 0 4px rgba(76,175,80,0.12)' }}>
                      <CheckCircle className="w-10 h-10" style={{ color: '#4CAF50' }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-700">Shift Completed</h2>
                      <p className="text-sm mt-1 text-slate-500">Today's attendance recorded successfully</p>
                    </div>
                    <div className="relative">
                      <div className="text-6xl md:text-7xl font-extrabold tracking-wider tabular-nums text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {hh}:{mm}:{ss}
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        <div className="px-3 py-1 rounded-xl text-xs font-bold" style={{ background: '#f0fdf4', color: '#4CAF50' }}>{totalMin} min</div>
                        <div className="px-3 py-1 rounded-xl text-xs font-bold" style={{ background: '#E3F0FA', color: '#1A78C2' }}>{totalHrs} hrs</div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <div className="text-center px-5 py-3 rounded-2xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', minWidth: '120px' }}>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Check In</div>
                        <div className="text-base font-bold mt-0.5 flex items-center justify-center gap-1.5 text-slate-750">
                          <LogIn className="w-4 h-4 text-emerald-500" /> {fmt12(checkInTime)}
                        </div>
                      </div>
                      <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', minWidth: '120px' }}>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Check Out</div>
                        <div className="text-base font-bold mt-0.5 flex items-center justify-center gap-1.5 text-slate-750">
                          <LogOut className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> {fmt12(checkOutTime)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button onClick={handleLogout}
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #1A78C2, #1565A3)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(26,120,194,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,120,194,0.25)'; }}>
                        <ArrowRight className="w-5 h-5" /> Done — Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
function AdminEmployeeList({ role, employees, dailyLogs, showPasswords, nameSearch, setNameSearch, idSearch, setIdSearch, deptFilter, setDeptFilter, onTogglePassword, onSelectEmployee, onLoginAsEmployee }) {
  const navigate = useNavigate()

  const departments = [...new Set(employees.map(e => e.dept).filter(Boolean))]
  const isSuperAdmin = role === 'super_admin'
  const presentToday = dailyLogs.filter(l => l.status === 'Present').length
  const absentToday = dailyLogs.filter(l => l.status === 'Absent').length
  const lateToday = dailyLogs.filter(l => l.status === 'Late').length
  const stats = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: '#1A78C2' },
    { label: 'Present Today', value: presentToday, icon: UserCheck, color: '#4CAF50' },
    { label: 'Absent', value: absentToday, icon: UserX, color: '#f87171' },
    { label: 'Late', value: lateToday, icon: AlertTriangle, color: '#f59e0b' },
  ]

  const filtered = employees.filter(e =>
    (e.name.toLowerCase().includes(nameSearch.toLowerCase())) &&
    (e.id.toLowerCase().includes(idSearch.toLowerCase())) &&
    (!deptFilter || e.dept === deptFilter)
  )

  const exportToExcel = () => {
    const header = ['Employee ID', 'Name', 'Department', 'Email', 'Password']
    const rows = employees.map(e => [e.id, e.name, e.dept, e.email, e.password])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'devna_employees_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportMonthlyReport = () => {
    const header = ['Date', 'Employee ID', 'Name', 'Department', 'Check In', 'Check Out', 'Working Hours', 'Overtime', 'Status']
    const rows = dailyLogs.map(l => [l.date, l.id, l.name, employees.find(e => e.id === l.id)?.dept || '', l.in, l.out, l.hours, l.ot, l.status])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'devna_monthly_report_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/dashboard')} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-200" style={{ color: 'var(--text-secondary)' }} title="Back to Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View all employee credentials and daily attendance logs.</p>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="btn-secondary text-xs py-2 px-3"><Download className="w-3.5 h-3.5" /> Export Credentials</button>
            <button onClick={exportMonthlyReport} className="btn-primary text-xs py-2 px-3" style={{ background: 'linear-gradient(135deg, #4CAF50, #388E3C)' }}><FileSpreadsheet className="w-3.5 h-3.5" /> Monthly Report</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: (i * 80) + 'ms' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, ' + s.color + ' 12%, transparent)' }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name..." value={nameSearch} onChange={e => setNameSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by ID..." value={idSearch} onChange={e => setIdSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Email</th>
                {isSuperAdmin && <th>Password</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.email} className="table-row cursor-pointer" onClick={() => onSelectEmployee(emp)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #1A78C2, #0D4F7A)', color: '#fff' }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: emp.dept === 'Production' ? 'rgba(26,120,194,0.1)' : emp.dept === 'HR' ? 'rgba(76,175,80,0.1)' : emp.dept === 'Warehouse' ? 'rgba(245,158,11,0.1)' : emp.dept === 'Finance' ? 'rgba(16,185,129,0.1)' : emp.dept === 'IT' ? 'rgba(139,92,246,0.1)' : 'rgba(236,72,153,0.1)',
                        color: emp.dept === 'Production' ? '#1A78C2' : emp.dept === 'HR' ? '#4CAF50' : emp.dept === 'Warehouse' ? '#d97706' : emp.dept === 'Finance' ? '#059669' : emp.dept === 'IT' ? '#7c3aed' : '#db2777',
                      }}>
                      <Building2 className="w-3 h-3" />
                      {emp.dept}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs">{emp.email}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <KeyRound className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono text-xs">{showPasswords[emp.email] ? emp.password : '••••••'}</span>
                        <button onClick={(e) => { e.stopPropagation(); onTogglePassword(emp.email) }} className="p-1 rounded hover:bg-gray-100 transition-colors">
                          {showPasswords[emp.email] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); onSelectEmployee(emp) }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 20%, transparent)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'}>
                        <BarChart3 className="w-3.5 h-3.5" /> Logs
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onLoginAsEmployee(emp) }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #4CAF50, #388E3C)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}>
                        <LogIn className="w-3.5 h-3.5" /> Login
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No employees found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span>Showing {filtered.length} of {employees.length} employees</span>
        </div>
      </div>
    </div>
  )
}

function AdminEmployeeDetail({ emp, logs, onBack }) {
  const present = logs.filter(l => l.status === 'Present').length
  const absent = logs.filter(l => l.status === 'Absent').length
  const late = logs.filter(l => l.status === 'Late').length
  const totalHrs = logs.reduce((acc, l) => acc + (parseInt(l.hours) || 0), 0)
  const totalOt = logs.reduce((acc, l) => acc + (parseInt(l.ot) || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(135deg, #1A78C2, #0D4F7A)', color: '#fff' }}>
            {emp.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{emp.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{emp.id} · {emp.dept} · {emp.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Present', value: present, color: '#4CAF50', icon: UserCheck },
          { label: 'Absent', value: absent, color: '#f87171', icon: UserX },
          { label: 'Late', value: late, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Total Hours', value: totalHrs + 'h', color: '#1A78C2', icon: Clock },
          { label: 'Overtime', value: totalOt + 'h', color: '#7c3aed', icon: Activity },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, ' + s.color + ' 12%, transparent)' }}>
              <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            Daily Attendance Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header"><th>Date</th><th>Check In</th><th>Check Out</th><th>Working Hours</th><th>Overtime</th><th>Status</th></tr></thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="table-row">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{log.date}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: log.in === '--' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{log.in}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: log.out === '--' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{log.out}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-primary)' }}>{log.hours}</td>
                  <td className="px-4 py-3" style={{ color: log.ot === '0h' ? 'var(--text-muted)' : '#4CAF50' }}>{log.ot}</td>
                  <td className="px-4 py-3">
                    <span className={'badge ' + (log.status === 'Present' ? 'badge-success' : log.status === 'Absent' ? 'badge-danger' : 'badge-warning')}>
                      {log.status === 'Present' ? <UserCheck className="w-3 h-3" /> : log.status === 'Absent' ? <UserX className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attendance logs found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard
