import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Users, DollarSign, Download, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getEmployees, getPayrollRecords } from '../../lib/db'

const COLORS = ['#1A78C2', '#1A78C2', '#4CAF50', '#4CAF50', '#1A78C2']

function Reports() {
  const [reportType, setReportType] = useState('headcount')
  const [deptData, setDeptData] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getEmployees(), getPayrollRecords()]).then(([emps, pays]) => {
      const deptMap = {}
      emps.forEach(e => {
        const dept = e.dept || 'Other'
        if (!deptMap[dept]) deptMap[dept] = { name: dept, headcount: 0, salary: 0 }
        deptMap[dept].headcount++
      })
      pays.forEach(p => {
        const emp = emps.find(e => e.employee_id === p.employee_id)
        const dept = emp?.dept || 'Other'
        if (deptMap[dept]) deptMap[dept].salary += Number(p.net_pay || p.gross_pay || 0)
      })
      setDeptData(Object.values(deptMap).map(d => ({ ...d, attrition: 0 })))

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const hiringByMonth = new Array(12).fill(0)
      emps.forEach(e => {
        const d = e.doj || e.date_of_joining || ''
        if (!d) return
        const joined = new Date(d)
        if (isNaN(joined.getTime())) return
        const m = joined.getMonth()
        const y = joined.getFullYear()
        if (y === new Date().getFullYear()) hiringByMonth[m]++
      })
      setMonthlyTrend(months.map((m, i) => ({ month: m, hiring: hiringByMonth[i], attrition: 0 })))

      setLoading(false)
    }).catch(err => { console.error('Failed to load reports data:', err); setLoading(false) })
  }, [])

  const totalHeadcount = deptData.reduce((s, d) => s + d.headcount, 0)
  const totalSalary = deptData.reduce((s, d) => s + d.salary, 0)

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>HR analytics, workforce planning, and compliance reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('PDF export coming soon')} className="btn-secondary text-xs"><Download className="w-4 h-4" /> Export PDF</button>
          <button onClick={() => alert('Excel export coming soon')} className="btn-secondary text-xs"><FileText className="w-4 h-4" /> Export Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Headcount', value: totalHeadcount, icon: Users, color: '#1A78C2' },
          { label: 'Total Salary/Month', value: `₹${(totalSalary / 100000).toFixed(1)}L`, icon: DollarSign, color: '#4CAF50' },
          { label: 'Avg Attrition', value: deptData.length > 0 ? `${(deptData.reduce((s, d) => s + d.attrition, 0) / deptData.length).toFixed(1)}%` : '0%', icon: TrendingUp, color: '#1A78C2' },
          { label: 'Reports Generated', value: '—', icon: BarChart2, color: '#1A78C2' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Department Headcount</h2>
            <div className="flex gap-2">
              {[
                { key: 'headcount', label: 'Headcount', icon: Users },
                { key: 'salary', label: 'Salary', icon: DollarSign },
              ].map(r => (
                <button key={r.key} onClick={() => setReportType(r.key)}
                  className="tab-btn text-xs" data-active={reportType === r.key}>
                  <r.icon className="w-3.5 h-3.5" /> {r.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              <Bar dataKey={reportType === 'headcount' ? 'headcount' : 'salary'} fill="#1A78C2" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Headcount Distribution</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <RPieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="headcount">
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {deptData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.headcount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Hiring vs Attrition Trend ({new Date().getFullYear()})</h2>
        {monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              <Line type="monotone" dataKey="hiring" stroke="#4CAF50" strokeWidth={3} dot={{ r: 5, fill: '#4CAF50' }} name="Hiring" />
              <Line type="monotone" dataKey="attrition" stroke="#1A78C2" strokeWidth={3} dot={{ r: 5, fill: '#1A78C2' }} name="Attrition" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            No trend data available
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
