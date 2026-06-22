import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTheme } from '../../lib/ThemeContext'

function Layout() {
  const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onMenuToggle={() => setMobileOpen(true)}
          onCollapseToggle={() => setSidebarCollapsed(p => !p)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-200" style={{ background: 'var(--bg)' }}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
