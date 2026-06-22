import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardHat, LogIn, ShieldCheck, ArrowRight, Users, Clock, DollarSign,
  Package, BarChart3, CalendarCheck, Building2, TrendingUp,
  UserCheck, Leaf, Shield, Sparkles, Quote, Star, ChevronRight, Menu, X
} from 'lucide-react'

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function useCounter(end, duration = 2000, start = 0) {
  const [val, setVal] = useState(start)
  useEffect(() => {
    let frame
    const startTime = performance.now()
    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(start + (end - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [end, duration, start])
  return val
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, label, sub, delay }) {
  const [ref, visible] = useReveal()
  const count = useCounter(visible ? parseInt(label.replace(/[^\d]/g, '')) : 0, 2000)
  const suffix = label.replace(/[\d.,]+/g, '').trim()
  const prefix = label.startsWith('₹') ? '₹' : ''
  const isPercent = label.includes('%')

  return (
    <div ref={ref}
      className="relative group p-6 rounded-2xl bg-white border border-primary/10 shadow-lg shadow-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20 hover:scale-[1.03]"
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-4 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-primary-dark">
          {prefix}{visible ? count : 0}{isPercent ? '%' : suffix === label ? '' : ` ${suffix}`}
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</div>
      </div>
    </div>
  )
}

const features = [
  { icon: Users, title: 'Employee Management', desc: 'Centralized employee profiles, documents, and lifecycle management from onboarding to exit.' },
  { icon: CalendarCheck, title: 'Attendance & Leaves', desc: 'Real-time tracking, leave requests, and automated attendance reports with shift management.' },
  { icon: DollarSign, title: 'Payroll & Taxation', desc: 'Automated salary processing, tax calculations, and payslip generation with compliance.' },
  { icon: Package, title: 'Asset Management', desc: 'Track company assets, allocations, recoveries, and exit clearance workflows.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Interactive dashboards with real-time KPIs, trends, and exportable reports.' },
  { icon: Building2, title: 'Shift Scheduling', desc: 'Flexible shift planning, overtime management, and schedule optimization tools.' },
]

const stats = [
  { icon: Users, label: '156+', sub: 'Employees Onboarded' },
  { icon: Clock, label: '98%', sub: 'Attendance Rate' },
  { icon: DollarSign, label: '₹2.4Cr', sub: 'Annual Payroll' },
  { icon: Package, label: '320+', sub: 'Assets Managed' },
]

const testimonials = [
  { text: 'Devna HRMS streamlined our entire workforce management. Attendance tracking and payroll processing that used to take days now takes minutes.', author: 'Rajesh Kumar', role: 'HR Director' },
  { text: 'The asset management module is a game-changer. We now have real-time visibility into every company asset across all our project sites.', author: 'Priya Sharma', role: 'Operations Head' },
]

const logos = [
  'Building & Infrastructure', 'Heavy Engineering', 'Project Management',
  'Quality Assurance', 'Safety Compliance', 'Green Energy'
]

function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Devna Engineers</div>
                <div className="text-[10px] tracking-wide" style={{ color: 'var(--text-muted)' }}>ENTERPRISE HRMS</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm" style={{ color: 'var(--text-secondary)' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Features</a>
              <a href="#stats" className="text-sm" style={{ color: 'var(--text-secondary)' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Impact</a>
              <a href="#testimonials" className="text-sm" style={{ color: 'var(--text-secondary)' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Testimonials</a>
              <div className="flex gap-3">
                <button onClick={() => navigate('/employee')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}>
                  <Users className="w-4 h-4" /> Employee Login
                </button>
                <button onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 4px 14 rgba(26,120,194,0.25)' }}
                  onMouseOver={e => e.target.style.boxShadow = '0 4px 20px rgba(26,120,194,0.4)'}
                  onMouseOut={e => e.target.style.boxShadow = '0 4px 14px rgba(26,120,194,0.25)'}>
                  <ShieldCheck className="w-4 h-4" /> Admin Login
                </button>
              </div>
            </nav>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" style={{ color: 'var(--text-secondary)' }}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 py-4 space-y-3 animate-fade-in" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--text-secondary)' }}>Features</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--text-secondary)' }}>Impact</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--text-secondary)' }}>Testimonials</a>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => navigate('/employee')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>
                Employee Login
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}>Admin Login</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-white to-accent-light animate-gradient-shift" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-float" style={{ background: 'rgba(26,120,194,0.06)' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float-delayed" style={{ background: 'rgba(76,175,80,0.06)' }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl animate-float" style={{ background: 'rgba(26,120,194,0.04)', animationDelay: '1s' }} />
        </div>

        <div className="absolute top-32 left-[15%] w-6 h-6 rounded-full animate-float" style={{ border: '2px solid rgba(26,120,194,0.2)' }} />
        <div className="absolute top-48 right-[20%] w-4 h-4 rounded-full animate-float-delayed" style={{ background: 'rgba(26,120,194,0.1)' }} />
        <div className="absolute bottom-48 left-[10%] w-8 h-8 rounded-lg animate-float" style={{ border: '2px solid rgba(76,175,80,0.2)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-[12%] w-5 h-5 animate-float-delayed" style={{ background: 'rgba(76,175,80,0.1)', animationDelay: '0.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in" style={{ background: 'rgba(26,120,194,0.1)', border: '1px solid rgba(26,120,194,0.2)', color: 'var(--color-primary)' }}>
                <Sparkles className="w-4 h-4" /> Next-Gen HRMS Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ color: 'var(--color-primary-dark)' }}>
                Empower Your{' '}
                <span className="bg-gradient-to-r from-primary via-primary-dark to-accent bg-clip-text text-transparent">
                  Workforce
                </span>
                <br />
                with Intelligent HRMS
              </h1>
              <p className="text-lg max-w-xl mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Devna HRMS is a comprehensive workforce management platform built for engineering enterprises — 
                streamlining attendance, payroll, asset tracking, and compliance under one unified dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button onClick={() => navigate('/employee')}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold border transition-all duration-300 hover:scale-[1.02]"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}>
                  <span className="relative flex items-center gap-3">
                    <Users className="w-5 h-5" /> Employee Login
                  </span>
                </button>
                <button onClick={() => navigate('/login')}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 8px 30px rgba(26,120,194,0.35)' }}
                  onMouseOver={e => e.target.style.boxShadow = '0 8px 40px rgba(26,120,194,0.5)'}
                  onMouseOut={e => e.target.style.boxShadow = '0 8px 30px rgba(26,120,194,0.35)'}>
                  <span className="relative flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5" /> Admin Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 rounded-2xl overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold animate-fade-in" style={{ background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', color: 'var(--text-secondary)', animationDelay: `${i * 0.1}s` }}>
                      {['RK', 'PS', 'AM', 'VK'][i - 1]}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>+50</div>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>50+</span> HR professionals trust us
                </div>
              </div>
            </div>

            {/* Hero Graphic */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-96 h-96 rounded-3xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, rgba(26,120,194,0.1), white, rgba(76,175,80,0.1))', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 60px rgba(26,120,194,0.1)' }}>
                  <div className="w-80 h-80 rounded-2xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
                      </div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Devna HRMS Dashboard</div>
                    </div>
                    {[
                      { label: 'Total Employees', value: '156', color: 'var(--color-primary)', percent: 78 },
                      { label: 'Present Today', value: '142', color: 'var(--color-accent)', percent: 91 },
                      { label: 'On Leave', value: '8', color: 'var(--color-accent)', percent: 5 },
                      { label: 'Pending Approvals', value: '12', color: 'var(--color-primary)', percent: 8 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.percent}%`, background: item.color }} />
                          </div>
                          <span className="font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Updated just now</span>
                      <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--color-accent)' }} /> Live
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl animate-float-delayed" style={{ background: 'linear-gradient(135deg, var(--color-accent), #388E3C)' }}>
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-[8px] font-bold mt-0.5">+24%</span>
                </div>
                <div className="absolute -bottom-4 -left-8 px-4 py-3 rounded-xl shadow-xl animate-float" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>98% <span style={{ color: 'var(--text-muted)' }}>attendance</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '2s' }}>
          <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Scroll</span>
          <div className="w-5 h-8 rounded-full flex justify-center pt-1.5" style={{ border: '2px solid var(--border)' }}>
            <div className="w-1 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-muted)' }} />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="relative py-12" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(227,240,250,0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--text-muted)' }}>Trusted by engineering teams across</p>
          <div className="flex overflow-hidden">
            <div className="flex gap-12 animate-marquee">
              {[...logos, ...logos].map((name, i) => (
                <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                  <Building2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-20">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, white, rgba(26,120,194,0.04), white)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'rgba(26,120,194,0.1)', color: 'var(--color-primary)' }}>
                <BarChart3 className="w-4 h-4" /> Our Impact
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Numbers That Speak</h2>
              <p className="mt-3 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>Real metrics from our growing enterprise platform</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, i) => (
              <StatCard key={i} {...s} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20">
        <div className="absolute inset-0" style={{ background: 'rgba(232,245,233,0.4)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'rgba(76,175,80,0.1)', color: 'var(--color-accent)' }}>
                <Sparkles className="w-4 h-4" /> Powerful Modules
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Everything You Need to Manage Your Workforce</h2>
              <p className="mt-3 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                From hiring to retirement, Devna HRMS provides end-to-end tools designed for engineering and construction enterprises.
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i}
                className="group relative p-7 rounded-2xl transition-all duration-500 hover:-translate-y-2 cursor-default"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                  opacity: 0,
                  animation: `reveal-up 0.6s ease-out ${i * 0.1}s forwards`,
                }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(26,120,194,0.12)' }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = 'var(--shadow)' }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(26,120,194,0.04), rgba(76,175,80,0.04))' }} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-500" style={{ background: 'linear-gradient(135deg, rgba(26,120,194,0.1), rgba(76,175,80,0.1))' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(26,120,194,0.1), rgba(76,175,80,0.1))' }}>
                    <f.icon className="w-6 h-6 transition-colors duration-500" style={{ color: 'var(--color-primary)' }}
                      onMouseOver={e => e.target.style.color = 'white'}
                      onMouseOut={e => e.target.style.color = 'var(--color-primary)'} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl origin-left" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Devna Section */}
      <section className="relative py-20">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark), rgba(13,79,122,0.9))' }} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl animate-float-delayed" style={{ background: 'rgba(76,175,80,0.3)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Built for Engineering Excellence
            </h2>
            <p className="max-w-2xl mx-auto mb-12 text-lg" style={{ color: 'rgba(227,240,250,0.8)' }}>
              Devna HRMS is purpose-built for the unique challenges of engineering and infrastructure enterprises.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Enterprise Security', desc: 'Role-based access, encrypted data, and audit trails to protect sensitive HR information.' },
              { icon: Leaf, title: 'Sustainable Practices', desc: 'Paperless workflows, digital signatures, and eco-friendly HR operations.' },
              { icon: TrendingUp, title: 'Scalable Growth', desc: 'Architecture that scales with your team from 50 to 5,000+ employees.' },
              { icon: Clock, title: 'Real-time Sync', desc: 'Live attendance, instant approvals, and real-time payroll updates across all sites.' },
            ].map((item, i) => (
              <div key={i}
                className="group p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  opacity: 0,
                  animation: `reveal-up 0.6s ease-out ${i * 0.15}s forwards`,
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-500" style={{ background: 'rgba(255,255,255,0.2)' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(227,240,250,0.7)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'rgba(26,120,194,0.1)', color: 'var(--color-primary)' }}>
                <Star className="w-4 h-4" /> Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>What Our Clients Say</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i}
                className="relative p-8 rounded-2xl transition-all duration-500"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                  opacity: 0,
                  animation: `reveal-up 0.6s ease-out ${i * 0.2}s forwards`,
                }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 20px 50px rgba(26,120,194,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}>
                <Quote className="w-8 h-8 absolute top-6 right-6" style={{ color: 'rgba(26,120,194,0.1)' }} />
                <p className="leading-relaxed mb-6 italic" style={{ color: 'var(--text-secondary)' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold">
                    {t.author.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.author}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,120,194,0.04), rgba(76,175,80,0.04))' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-primary-dark)' }}>
              Ready to Transform Your HR Operations?
            </h2>
            <p className="mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join 50+ engineering teams already using Devna HRMS. Get started with a single click.
            </p>
            <div className="flex justify-center gap-4 flex-col sm:flex-row">
              <button onClick={() => navigate('/employee')}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold border transition-all duration-300 hover:scale-[1.02]"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
                onMouseOver={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}>
                <Users className="w-5 h-5" /> Employee Login
              </button>
              <button onClick={() => navigate('/login')}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 8px 30px rgba(26,120,194,0.35)' }}
                onMouseOver={e => e.target.style.boxShadow = '0 8px 40px rgba(26,120,194,0.5)'}
                onMouseOut={e => e.target.style.boxShadow = '0 8px 30px rgba(26,120,194,0.35)'}>
                <ShieldCheck className="w-5 h-5" /> Admin Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src="/unnamed.webp" alt="Logo" className="w-full h-full object-contain scale-125" />
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Devna Engineers</span>
              </div>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
                Enterprise HRMS platform purpose-built for engineering and infrastructure companies.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Quick Links</h4>
              <div className="space-y-2">
                {['Features', 'Impact', 'Testimonials', 'Employee Login', 'Admin Login'].map(link => (
                  <a key={link} href={link === 'Admin Login' || link === 'Employee Login' ? undefined : `#${link.toLowerCase()}`}
                    onClick={link === 'Admin Login' ? () => navigate('/login') : link === 'Employee Login' ? () => navigate('/employee') : undefined}
                    className="block text-xs cursor-pointer transition-colors" style={{ color: 'var(--text-muted)' }}
                    onMouseOver={e => e.target.style.color = 'var(--color-primary)'}
                    onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Contact</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Devna Engineers Pvt. Ltd.<br />
                support@devnaengineers.com<br />
                +91 1800-123-4567
              </p>
            </div>
          </div>
          <div className="pt-6 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            &copy; 2026 Devna Engineers Pvt. Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
