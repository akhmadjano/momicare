import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LanguageSwitcher from './LanguageSwitcher'

/* ── Icons (inline SVG) ─────────────────────────────────── */
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  dashboard:   'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  patients:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  alerts:      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  regional:    'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4 M8 2v16 M16 6v16',
  assignments: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-4-4h-2 M9 7a4 4 0 100 8 4 4 0 000-8z M19 7l3 3-3 3',
  checkin:     'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  activity:    'M22 12h-4l-3 9L9 3l-3 9H2',
  nurse:       'M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4l3 3',
  logout:      'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  collapse:    'M11 17l-5-5 5-5 M18 17l-5-5 5-5',
  expand:      'M13 17l5-5-5-5 M6 17l5-5-5-5',
  bell:        'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  menu:        'M3 12h18 M3 6h18 M3 18h18',
}

const ROLE_NAV = {
  patient: [
    { to: '/checkin',     icon: 'checkin',  key: 'nav.checkin'    },
    { to: '/my-activity', icon: 'activity', key: 'nav.myActivity' },
  ],
  nurse: [
    { to: '/nurse', icon: 'nurse', key: 'nav.dataEntry' },
  ],
  doctor: [
    { to: '/dashboard', icon: 'dashboard', key: 'nav.dashboard' },
    { to: '/dashboard', icon: 'patients',  key: 'common.patients', exact: false },
  ],
  admin: [
    { to: '/dashboard',         icon: 'dashboard',   key: 'nav.dashboard'   },
    { to: '/regional',          icon: 'regional',    key: 'nav.regional'    },
    { to: '/admin/assignments', icon: 'assignments', key: 'nav.assignments' },
    { to: '/dashboard',         icon: 'alerts',      key: 'detail.alerts', extra: true },
  ],
}

export default function AppLayout({ children }) {
  const { auth, logout } = useAuth()
  const { t }            = useLang()
  const location         = useLocation()
  const navigate         = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQ,   setSearchQ]   = useState('')

  const navItems = ROLE_NAV[auth?.role] ?? []

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
    return location.pathname.startsWith(to)
  }

  return (
    <div className="app-shell">

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        {/* Logo */}
        <div style={{
          height: 'var(--header-h)',
          display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 20px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          flexShrink: 0, gap: 10, overflow: 'hidden',
        }}>
          <span style={{ fontSize: '1.35rem', flexShrink: 0, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🤰</span>
          {!collapsed && (
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
              Momi<span style={{ color: 'var(--cr-300)' }}>Care</span>
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item, i) => {
            const active = isActive(item.to)
            return (
              <Link key={i} to={item.to} title={collapsed ? t(item.key) : undefined} style={{
                display: 'flex', alignItems: 'center',
                gap: 11, padding: collapsed ? '10px 13px' : '9px 13px',
                borderRadius: 'var(--r-md)',
                color: active ? '#fff' : 'rgba(255,255,255,.52)',
                background: active
                  ? 'linear-gradient(90deg, rgba(181,0,24,.55) 0%, rgba(107,33,168,.40) 100%)'
                  : 'transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'all .15s',
                borderLeft: active ? '3px solid var(--cr-300)' : '3px solid transparent',
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.07)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ flexShrink: 0, opacity: active ? 1 : .65 }}>
                  <Ico d={ICONS[item.icon]} size={17} />
                </span>
                {!collapsed && (
                  <span style={{ fontSize: '.845rem', fontWeight: active ? 650 : 450, letterSpacing: '.005em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(item.key)}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + collapse */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.06)',
          padding: collapsed ? '10px 8px' : '10px 8px',
          flexShrink: 0,
        }}>
          {/* User row */}
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', marginBottom: 4,
              borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,.07)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'var(--g-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '.8rem', fontWeight: 800,
              }}>
                {auth?.role?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {auth?.role ? t(`common.${auth.role}`) : ''}
                </div>
                <div style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.40)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {auth?.role}
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/login') }} title={t('common.signOut')} style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'rgba(255,255,255,.45)', cursor: 'pointer',
                padding: 4, borderRadius: 6, transition: 'color .15s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
              >
                <Ico d={ICONS.logout} size={15} />
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            width: '100%', padding: '7px 12px',
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,.35)', cursor: 'pointer',
            borderRadius: 'var(--r-sm)', transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.75)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
          >
            <Ico d={collapsed ? ICONS.expand : ICONS.collapse} size={16} />
          </button>
        </div>
      </aside>

      {/* ══ MAIN AREA ══════════════════════════════════════════ */}
      <div className="main-area">

        {/* Top header */}
        <header className="top-header">

          {/* Page title / breadcrumb area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dk)', margin: 0 }}>
              {navItems.find(n => isActive(n.to)) ? t(navItems.find(n => isActive(n.to)).key) : 'MomiCare'}
            </h2>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 240 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}>
              <Ico d={ICONS.search} size={14} />
            </span>
            <input
              className="inp"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={t('common.search')}
              style={{ paddingLeft: 32, height: 34, fontSize: '.82rem' }}
            />
          </div>

          {/* Lang + bell */}
          <LanguageSwitcher />

          <button style={{
            position: 'relative', background: 'none', border: 'none',
            color: 'var(--text-3)', padding: 7, borderRadius: 'var(--r-sm)',
            transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--lt-1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Ico d={ICONS.bell} size={18} />
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--cr-600)', border: '2px solid #fff',
            }} />
          </button>

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--g-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '.8rem', fontWeight: 800, cursor: 'default',
            flexShrink: 0,
          }}>
            {auth?.role?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
