import { useState, useEffect } from 'react'
import { Sun, Moon, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { getShiftSchedules } from '../../lib/db'

const shifts = [
  { name: 'Morning', time: '06:00 - 14:00', icon: Sun, color: '#4CAF50' },
  { name: 'Evening', time: '14:00 - 22:00', icon: Star, color: '#1A78C2' },
  { name: 'Night', time: '22:00 - 06:00', icon: Moon, color: '#1A78C2' },
]

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ShiftScheduler() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [shiftCounts, setShiftCounts] = useState({ Morning: 0, Evening: 0, Night: 0 })

  const getWeekRange = (offset) => {
    const now = new Date()
    now.setDate(now.getDate() + offset * 7)
    const day = now.getDay()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((day + 6) % 7))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    const fmt = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    return `${fmt(mon)} - ${fmt(sun)}`
  }
  const week = getWeekRange(weekOffset)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getShiftSchedules()
      const grouped = {}
      const counts = { Morning: 0, Evening: 0, Night: 0 }
      const seen = {}
      data.forEach(r => {
        if (!grouped[r.employee_id]) {
          grouped[r.employee_id] = { name: r.employees?.name || r.employee_name || 'Unknown', mon: '-', tue: '-', wed: '-', thu: '-', fri: '-', sat: '-', sun: '-' }
        }
        const dayMap = { 'Mon': 'mon', 'Tue': 'tue', 'Wed': 'wed', 'Thu': 'thu', 'Fri': 'fri', 'Sat': 'sat', 'Sun': 'sun' }
        const dayKey = dayMap[r.day]
        if (dayKey) {
          grouped[r.employee_id][dayKey] = r.shift_type || r.shift
        }
        const shiftName = r.shift_type || r.shift
        if (shiftName && (shiftName === 'Morning' || shiftName === 'Evening' || shiftName === 'Night')) {
          const key = `${r.employee_id}-${shiftName}`
          if (!seen[key]) {
            seen[key] = true
            counts[shiftName]++
          }
        }
      })
      setSchedules(Object.values(grouped))
      setShiftCounts(counts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Shift & Workforce Planning</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Schedule shifts and manage workforce assignments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {shifts.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <Icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.time}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: s.color }}>{shiftCounts[s.name]} employees</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{week}</span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={() => alert('Auto-schedule will assign shifts based on employee preferences and department needs.')} className="btn-primary text-xs"><Clock className="w-4 h-4" /> Auto Schedule</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="sticky left-0 z-10" style={{ background: 'var(--bg-card)' }}>Employee</th>
                {weekDays.map(d => <th key={d} className="text-center">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {schedules.map((emp, i) => (
                <tr key={i} className="table-row">
                  <td className="px-4 py-3 font-medium sticky left-0 z-10" style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{emp.name}</td>
                  {weekDays.map(d => {
                    const day = d.toLowerCase().slice(0, 3)
                    const shift = emp[day]
                    const shiftInfo = shifts.find(s => s.name === shift)
                    return (
                      <td key={d} className="px-3 py-3 text-center">
                        {shiftInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: `${shiftInfo.color}15`, color: shiftInfo.color }}>
                            <shiftInfo.icon className="w-3 h-3" /> {shift}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ShiftScheduler
