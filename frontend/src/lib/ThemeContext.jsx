import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const ROLES = {
  super_admin: { label: 'Super Admin', hierarchy: 0 },
  hr_manager: { label: 'HR Manager', hierarchy: 1 },
  manager: { label: 'Manager', hierarchy: 2 },
  dept_manager: { label: 'Department Manager', hierarchy: 3 },
  employee: { label: 'Employee', hierarchy: 4 },
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('devna_dark') === 'true')
  const [role, setRole] = useState(() => {
    const savedUser = localStorage.getItem('devna_user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        if (parsed && parsed.role) return parsed.role
      } catch (e) {}
    }
    return localStorage.getItem('devna_role') || 'super_admin'
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    localStorage.setItem('devna_dark', dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem('devna_role', role)
  }, [role])

  const toggleDark = () => setDark(p => !p)

  const switchRole = (r) => setRole(r)

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, role, switchRole, ROLES, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
