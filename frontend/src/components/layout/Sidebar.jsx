import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useTheme } from '../../lib/ThemeContext'
import {
  LayoutDashboard, Users, Clock, CalendarDays, ArrowLeftRight,
  DollarSign, Package, BarChart3, CheckSquare, Settings, X,
  ChevronDown, ChevronRight, HardHat, UserPlus, FileText,
  ClipboardCheck, UserCog, LogOut, Sun, Moon, Building2,
  UserCheck, Timer, CalendarRange, Receipt, Shield, HelpCircle,
  LifeBuoy, Fingerprint, UserCircle, Download, Activity, TrendingUp
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'hr_manager', 'manager', 'dept_manager', 'employee'] },
  { path: '/employee', label: 'Employee Logings', icon: Fingerprint, roles: ['super_admin', 'hr_manager', 'manager', 'employee'] },
  { path: '/app/attendance', label: 'Works', icon: Clock, roles: ['super_admin', 'hr_manager', 'manager'] },
  {
    label: 'Employee Management', icon: Users, roles: ['super_admin', 'hr_manager'],
    children: [
      { path: '/app/employees', label: 'All Employees', icon: Users },
      { path: '/app/employees/new', label: 'Add Employee', icon: UserPlus },
      { path: '/app/onboarding', label: 'Onboarding Employee', icon: UserCheck },
    ]
  },
  { path: '/app/employees/pay-salary', label: 'Pay Salary', icon: DollarSign, roles: ['super_admin'] },
  {
    label: 'Attendance', icon: Clock, roles: ['super_admin', 'hr_manager', 'manager', 'dept_manager', 'employee'],
    children: [
      { path: '/app/attendance', label: 'Daily Log', icon: Timer },
      { path: '/app/attendance/reports', label: 'Reports', icon: FileText },
      { path: '/app/attendance/leave', label: 'Leave Management', icon: CalendarDays },
      { path: '/app/attendance/leave/request', label: 'Request Leave', icon: CalendarRange },
    ]
  },
  {
    label: 'Shift & Workforce', icon: ArrowLeftRight, roles: ['super_admin', 'hr_manager', 'manager', 'dept_manager'],
    children: [
      { path: '/app/shifts', label: 'Shift Scheduler', icon: CalendarRange },
      { path: '/app/shifts/overtime', label: 'Overtime', icon: Timer },
    ]
  },
  {
    label: 'Asset Management', icon: Package, roles: ['super_admin', 'hr_manager', 'manager'],
    children: [
      { path: '/app/assets', label: 'All Assets', icon: Package },
      { path: '/app/assets/allocation', label: 'Allocations', icon: UserCheck },
      { path: '/app/assets/recovery', label: 'Recovery', icon: DollarSign },
      { path: '/app/assets/exit-clearance', label: 'Exit Clearance', icon: Shield },
    ]
  },
  { path: '/app/approvals', label: 'Approvals Center', icon: CheckSquare, roles: ['super_admin', 'hr_manager', 'manager', 'dept_manager'] },
  { path: '/app/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['super_admin', 'hr_manager', 'manager'] },
  { path: '/app/self-service', label: 'Self Service', icon: UserCog, roles: ['employee'] },
  { path: '/app/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'hr_manager', 'manager'] },
]

function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const { dark, toggleDark, role, switchRole, ROLES } = useTheme()
  const navigate = useNavigate()

  const visibleItems = navItems.filter(item => {
    if (item.roles) return item.roles.includes(role)
    if (item.children) return item.children.some(c => !c.roles || c.roles.includes(role))
    return true
  })

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'md:w-[68px]' : 'md:w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center h-16 px-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          {collapsed ? (
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center mx-auto shrink-0">
              <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>Devna Engineers</div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>HRMS Portal</div>
              </div>
            </div>
          )}
          <button onClick={onClose} className="md:hidden ml-2 p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item, i) =>
            item.children ? (
              <SidebarGroup key={i} item={item} collapsed={collapsed} onClose={onClose} />
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group
                  ${collapsed ? 'justify-center mx-0 px-0' : ''}
                  ${isActive ? 'bg-primary text-white font-medium shadow-sm' : ''}`}
                style={({ isActive }) => !isActive ? { color: 'var(--text-secondary)' } : {}}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className={`border-t shrink-0 ${collapsed ? 'p-2' : 'p-3'} space-y-2`} style={{ borderColor: 'var(--border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-1 py-1.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.avatar || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ROLES[role]?.label || 'Staff'}</div>
              </div>
            </div>
          )}
          <div className="flex w-full">
            <button onClick={() => { logout(); navigate('/login', { replace: true }) }}
              className="flex items-center justify-center p-2 rounded-lg transition-colors w-full" style={{ color: 'var(--text-muted)' }} title="Sign Out">
              <LogOut className="w-4 h-4" /> {!collapsed && <span className="ml-2 text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarGroup({ item, collapsed, onClose }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { role } = useTheme()
  const isActive = item.children.some(c => location.pathname.startsWith(c.path))

  const visibleChildren = item.children.filter(c => !c.roles || c.roles.includes(role))
  if (visibleChildren.length === 0) return null

  if (collapsed) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-center px-3 py-2.5 rounded-lg cursor-pointer" style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
          <item.icon className="w-[18px] h-[18px]" />
        </div>
        <div className="absolute left-full top-0 ml-2 w-48 rounded-xl shadow-lg border z-50 hidden group-hover:block" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {visibleChildren.map(child => (
            <NavLink key={child.path} to={child.path} onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg"
              style={({ isActive }) => ({ color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' })}>
              <child.icon className="w-4 h-4" /> {child.label}
            </NavLink>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group"
        style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
        <item.icon className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
        {visibleChildren.map(child => (
          <NavLink key={child.path} to={child.path} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 pl-10 mx-2 rounded-lg text-sm transition-all
              ${isActive ? 'bg-primary/10 font-medium' : ''}`}
            style={({ isActive }) => ({ color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' })}>
            <child.icon className="w-4 h-4 shrink-0" />
            {child.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
