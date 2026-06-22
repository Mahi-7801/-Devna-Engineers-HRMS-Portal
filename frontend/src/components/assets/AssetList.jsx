import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Monitor, Smartphone, Wrench, Truck, HardDrive, Laptop } from 'lucide-react'
import { getAssets } from '../../lib/db'

const iconMap = {
  'Laptop': Laptop,
  'Monitor': Monitor,
  'Mobile': Smartphone,
  'Equipment': Wrench,
  'Vehicle': Truck,
  'Storage': HardDrive,
}

function AssetList() {
  const [view, setView] = useState('list')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await getAssets()
      setAssets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalAssets = assets.length
  const allocated = assets.filter(a => a.status === 'Allocated').length
  const inStock = assets.filter(a => a.status === 'In Stock').length
  const totalValue = assets.reduce((s, a) => s + (a.cost || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Asset Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track company assets, allocation, and recovery.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/assets/allocation" className="btn-primary text-xs"><Plus className="w-4 h-4" /> Allocate Asset</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: totalAssets, color: 'var(--text-primary)' },
          { label: 'Allocated', value: allocated, color: '#1A78C2' },
          { label: 'In Stock', value: inStock, color: '#4CAF50' },
          { label: 'Total Value', value: `₹${(totalValue / 100000).toFixed(1)}L`, color: '#4CAF50' },
        ].map((s, i) => (
          <div key={i} className="card p-5"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div><div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div></div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-sm"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} /><input type="text" placeholder="Search assets..." className="input-field pl-10" /></div>
          <div className="flex gap-2 ml-auto">
            {['list', 'grid'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`${v === view ? 'btn-primary' : 'btn-secondary'} text-xs capitalize`}>{v}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="table-header">{['Asset', 'Tag', 'Category', 'Assignee', 'Status', 'Cost', 'Life (yrs)'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {assets.map((a, i) => {
                const Icon = iconMap[a.category] || Laptop
                return (
                  <tr key={a.asset_id || a.id || i} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
                          <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{a.tag || a.asset_tag}</td>
                    <td className="px-4 py-3"><span className="badge">{a.category}</span></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.assignee || '—'}</td>
                    <td className="px-4 py-3"><span className={`badge ${a.status === 'Allocated' ? 'badge-success' : a.status === 'In Stock' ? 'badge-info' : 'badge-warning'}`}>{a.status}</span></td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>₹{(a.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.life || a.lifetime_years}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AssetList
