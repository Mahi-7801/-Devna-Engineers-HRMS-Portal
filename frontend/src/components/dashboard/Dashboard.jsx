import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, CalendarDays, DollarSign, Package, CheckSquare, UserPlus, TrendingUp, ArrowUpRight, ArrowDownRight, HardHat } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from '../../lib/ThemeContext'
import { getEmployees, getLeaveRequests, getPayrollRecords, getTodayAttendance, getAssetAllocations, getAssetRecoveries, getAttendanceReport } from '../../lib/db'
import supabase from '../../lib/supabase'

function Dashboard() {
  const navigate = useNavigate()
  const { role } = useTheme()
  const [data, setData] = useState({ employees: [], attendance: [], leaveRequests: [], payroll: [], allocations: [], recoveries: [], weeklyAttendance: [] })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const last6Days = () => {
    const dates = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const dayName = (dateStr) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[new Date(dateStr + 'T00:00:00').getDay()]
  }

  useEffect(() => {
    const dates = last6Days()
    Promise.all([
      getEmployees().catch(err => { console.error('Failed to load employees:', err); return [] }),
      getTodayAttendance().catch(err => { console.error('Failed to load attendance:', err); return [] }),
      getLeaveRequests().catch(err => { console.error('Failed to load leave requests:', err); return [] }),
      getPayrollRecords().catch(err => { console.error('Failed to load payroll:', err); return [] }),
      getAssetAllocations().catch(err => { console.error('Failed to load allocations:', err); return [] }),
      getAssetRecoveries().catch(err => { console.error('Failed to load recoveries:', err); return [] }),
      getAttendanceReport({ fromDate: dates[0], toDate: dates[5] }).catch(err => { console.error('Failed to load weekly attendance:', err); return [] }),
    ]).then(([employees, attendance, leaveRequests, payroll, allocations, recoveries, weeklyAttendance]) => {
      setData({ employees, attendance, leaveRequests, payroll, allocations, recoveries, weeklyAttendance })
      setActivities(buildActivities(attendance, leaveRequests, allocations))
      setLoading(false)
    }).catch(err => { console.error('Failed to load dashboard data:', err); setLoading(false) })
  }, [])

  function buildActivities(attendanceRecords, leaveReqs, assetAllocs) {
    const items = []
    if (attendanceRecords) {
      attendanceRecords.forEach(a => {
        if (a.check_in && a.employees) {
          const [h, m] = a.check_in.split(':')
          const hour = parseInt(h)
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const hour12 = hour % 12 || 12
          items.push({
            user: a.employees.name,
            action: 'checked in',
            time: `${String(hour12).padStart(2, '0')}:${m} ${ampm}`,
            order: new Date().setHours(hour, parseInt(m), 0),
          })
        }
      })
    }
    if (leaveReqs) {
      leaveReqs.slice(0, 5).forEach(l => {
        const t = l.created_at ? new Date(l.created_at).getTime() : 0
        items.push({
          user: l.employee_name || 'Unknown',
          action: `submitted ${l.leave_type || 'a'} leave request`,
          time: l.created_at
            ? new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '',
          order: t,
        })
      })
    }
    if (assetAllocs) {
      assetAllocs.slice(0, 5).forEach(a => {
        const t = a.created_at ? new Date(a.created_at).getTime() : 0
        items.push({
          user: 'System',
          action: 'asset allocated',
          time: a.created_at
            ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '',
          order: t,
        })
      })
    }
    items.sort((a, b) => b.order - a.order)
    return items.slice(0, 8)
  }

  useEffect(() => {
    const refreshActivities = () => {
      Promise.all([
        getTodayAttendance().catch(() => []),
        getLeaveRequests().catch(() => []),
        getAssetAllocations().catch(() => []),
      ]).then(([attendance, leaveRequests, allocations]) => {
        setData(prev => ({ ...prev, attendance, leaveRequests, allocations }))
        setActivities(buildActivities(attendance, leaveRequests, allocations))
      })
    }
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, refreshActivities)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leave_requests' }, refreshActivities)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asset_allocations' }, refreshActivities)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const totalEmployees = data.employees.length
  const activeEmployees = data.employees.filter(e => e.status === 'active' || e.status === 'Active' || !e.status).length
  const newJoiners = data.employees.filter(e => {
    if (!e.doj && !e.join_date) return false
    const joined = new Date(e.doj || e.join_date)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return joined >= monthAgo
  }).length
  const attendanceToday = data.attendance.filter(a => a.status === 'Present' || a.check_in).length
  const onLeave = data.attendance.filter(a => a.status === 'Leave' || a.status === 'Absent').length + data.attendance.filter(a => a.status !== 'Present' && a.status !== 'Absent' && a.status !== 'Leave' && a.check_in).length
  const pendingApprovals = data.leaveRequests.filter(l => l.status === 'Pending').length

  const currentMonthPayroll = data.payroll.length > 0
    ? data.payroll.reduce((sum, r) => sum + (Number(r.net_pay) || Number(r.gross_pay) || 0), 0)
    : 0
  const payrollInLakhs = (currentMonthPayroll / 100000).toFixed(1)

  const totalRecoveries = data.recoveries.length
  const recoveredCount = data.recoveries.filter(r => r.status === 'Completed' || r.status === 'Paid').length
  const recoveryPct = totalRecoveries > 0 ? ((recoveredCount / totalRecoveries) * 100).toFixed(1) : '0'

  const currentMonthPayrollTotal = data.payroll.length > 0
    ? data.payroll.reduce((sum, r) => sum + (Number(r.net_pay) || Number(r.gross_pay) || 0), 0)
    : 0
  const grossTotal = currentMonthPayrollTotal
  const deductionsTotal = data.payroll.reduce((sum, r) => sum + (Number(r.deductions) || 0), 0)
  const netTotal = grossTotal - deductionsTotal
  const grossLakhs = (grossTotal / 100000).toFixed(2)
  const deductionsK = (deductionsTotal / 1000).toFixed(1)
  const netLakhs = (netTotal / 100000).toFixed(2)

  const deptDist = data.employees.reduce((acc, emp) => {
    const dept = emp.dept || 'Other'
    const existing = acc.find(d => d.name === dept)
    if (existing) existing.value++
    else acc.push({ name: dept, value: 1, color: dept === 'Production' ? '#1A78C2' : dept === 'HR' ? '#4CAF50' : dept === 'Warehouse' ? '#f59e0b' : dept === 'Finance' ? '#10b981' : dept === 'IT' ? '#7c3aed' : dept === 'Quality' ? '#db2777' : dept === 'Admin' ? '#4CAF50' : '#6b7280' })
    return acc
  }, []).sort((a, b) => b.value - a.value)

  const dates = last6Days()
  const attendanceTrend = dates.map(date => {
    const dayRecs = data.weeklyAttendance.filter(a => a.date === date)
    const present = dayRecs.filter(a => a.status === 'Present' || a.check_in).length
    const absent = dayRecs.filter(a => a.status === 'Absent' || (!a.check_in && a.status !== 'Present')).length
    const lateDay = dayRecs.filter(a => a.status === 'Late').length
    return { day: dayName(date), present, absent: absent || 0, late: lateDay || 0 }
  })

  const monthlyPayroll = data.payroll.reduce((acc, r) => {
    const m = r.month?.slice(0, 3) || ''
    if (m) {
      if (!acc[m]) acc[m] = 0
      acc[m] += Number(r.net_pay) || Number(r.gross_pay) || 0
    }
    return acc
  }, {})
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const payrollTrend = allMonths.map(m => ({
    month: m,
    amount: monthlyPayroll[m] ? parseFloat((monthlyPayroll[m] / 100000).toFixed(1)) : (m === allMonths[new Date().getMonth()] ? parseFloat(payrollInLakhs) || 0 : 0),
  }))

  const kpis = [
    { label: 'Total Employees', value: totalEmployees.toString(), change: newJoiners > 0 ? `+${newJoiners}` : '--', up: true, icon: Users, color: '#1A78C2' },
    { label: 'Active Employees', value: activeEmployees.toString(), change: totalEmployees > 0 ? `${((activeEmployees / totalEmployees) * 100).toFixed(0)}%` : '--', up: true, icon: Users, color: '#4CAF50' },
    { label: 'New Joiners', value: newJoiners.toString(), change: newJoiners > 0 ? `+${newJoiners}` : '--', up: true, icon: UserPlus, color: '#4CAF50' },
    { label: 'Attendance Today', value: attendanceToday.toString(), change: attendanceToday > 0 && totalEmployees > 0 ? `${((attendanceToday / totalEmployees) * 100).toFixed(1)}%` : '--', up: true, icon: Clock, color: '#1A78C2' },
    { label: 'On Leave', value: onLeave.toString(), change: onLeave > 0 ? `-${onLeave}` : '--', up: false, icon: CalendarDays, color: '#4CAF50' },
    { label: 'Pending Approvals', value: pendingApprovals.toString(), change: pendingApprovals > 0 ? `+${pendingApprovals}` : '--', up: true, icon: CheckSquare, color: '#1A78C2' },
    { label: 'Payroll This Month', value: `₹${payrollInLakhs}L`, change: '--', up: true, icon: DollarSign, color: '#4CAF50', roleLimit: 'super_admin' },
    { label: 'Asset Recovery', value: `${recoveryPct}%`, change: '--', up: true, icon: Package, color: '#1A78C2' },
  ]

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const visibleKpis = kpis.filter(k => !k.roleLimit || role === k.roleLimit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Enterprise overview — key HR metrics at a glance.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" /> Live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {visibleKpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${k.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: k.color }} />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${k.up ? 'text-success' : 'text-danger'}`}>
                  {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{k.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{k.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Trend (This Week)</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Last 6 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attendanceTrend} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--hover)' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              <Bar dataKey="present" fill="#1A78C2" radius={[6, 6, 0, 0]} maxBarSize={36} name="Present" />
              <Bar dataKey="absent" fill="var(--border)" radius={[6, 6, 0, 0]} maxBarSize={36} name="Absent" />
              <Bar dataKey="late" fill="#4CAF50" radius={[6, 6, 0, 0]} maxBarSize={36} name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Department Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={deptDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {deptDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {deptDist.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span style={{ color: 'var(--text-secondary)' }} className="flex-1">{d.name}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${role === 'super_admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {role === 'super_admin' && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Payroll Summary</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={payrollTrend}>
                <defs><linearGradient id="payrollG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A78C2" stopOpacity={0.2} /><stop offset="100%" stopColor="#1A78C2" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
                <Area type="monotone" dataKey="amount" stroke="#1A78C2" strokeWidth={2.5} fill="url(#payrollG)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Gross', value: `₹${grossLakhs}L`, color: 'var(--text-primary)' },
                { label: 'Deductions', value: `₹${deductionsK}K`, color: '#1A78C2' },
                { label: 'Net Payable', value: `₹${netLakhs}L`, color: '#4CAF50' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Asset Recovery Status</h2>
          {data.recoveries.length > 0 ? (
            data.recoveries.slice(0, 4).map((a, i) => {
              const pct = a.total > 0 ? Math.round((a.paid / a.total) * 100) : 0
              return (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{a.asset_name || a.employee_name || 'Asset'}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all animate-slide-left" style={{ width: `${pct}%`, background: '#1A78C2' }} />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No asset records</p>
            </div>
          )}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Recovery Rate</span>
              <span className="font-bold" style={{ color: '#1A78C2' }}>{recoveryPct}%</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
            <button onClick={() => navigate('/app/approvals')} className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>View all</button>
          </div>
          <div className="space-y-0">
            {activities.length > 0 ? activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
                  {a.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.user}</span>{' '}
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{a.time}</span>
              </div>
            )) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No recent activity</p>
                <p className="text-[10px] mt-1">Activity will appear here when employees check in or submit requests.</p>
              </div>
            )}
          </div>
          <div className={`grid ${role === 'super_admin' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-4`}>
            <button onClick={() => navigate('/app/attendance')} className="btn-primary w-full justify-center text-xs py-2.5">Mark Attendance</button>
            {role === 'super_admin' && (
              <button onClick={() => navigate('/app/employees/pay-salary')} className="btn-secondary w-full justify-center text-xs py-2.5">Process Payroll</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
