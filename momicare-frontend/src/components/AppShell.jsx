import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LangSwitcher from './LangSwitcher'

/* ── Inline SVG icon ──────────────────────────────────── */
const Icon = ({ d, size = 18, strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  home:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  dash:    ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  patient: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  bell:    ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
  map:     ['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4', 'M8 2v16', 'M16 6v16'],
  link:    ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8', 'M23 21v-2a4 4 0 00-4-4h-2', 'M19 7l3 3-3 3'],
  heart:   'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  steth:   ['M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3', 'M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4'],
  chart:   ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  logout:  ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  chevL:   'M15 18l-6-6 6-6',
  chevR:   'M9 18l6-6-6-6',
  menu:    ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  search:  ['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0'],
  x:       ['M18 6L6 18', 'M6 6l12 12'],
  check:   'M20 6L9 17l-5-5',
  user:    ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8'],
}

/* ── Nav item config per role ─────────────────────────── */
const NAV = {
  patient: [
    { to: '/checkin',     icon: 'heart',   labelKey: 'nav.checkin',    mobileLabel: 'Nazorat' },
    { to: '/my-activity', icon: 'chart',   labelKey: 'nav.myActivity', mobileLabel: 'Tarix'   },
  ],
  nurse: [
    { to: '/nurse',       icon: 'steth',   labelKey: 'nav.dataEntry',  mobileLabel: 'Kiritish' },
  ],
  doctor: [
    { to: '/dashboard',   icon: 'dash',    labelKey: 'nav.dashboard',  mobileLabel: 'Panel'   },
  ],
  admin: [
    { to: '/dashboard',         icon: 'dash',    labelKey: 'nav.dashboard',   mobileLabel: 'Panel'     },
    { to: '/regional',          icon: 'map',     labelKey: 'nav.regional',    mobileLabel: 'Mintaqa'   },
    { to: '/admin/assignments', icon: 'link',    labelKey: 'nav.assignments', mobileLabel: 'Tayinlash' },
  ],
}

const ROLE_LABEL = { patient: 'Bemor', nurse: 'Hamshira', doctor: 'Shifokor', admin: 'Admin' }

export default function AppShell({ children }) {
  const { auth, logout } = useAuth()
  const { t }            = useLang()
  const location         = useLocation()
  const navigate         = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const items     = NAV[auth?.role] ?? []
  const isActive  = (to) => to === '/dashboard'
    ? location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
    : location.pathname.startsWith(to)

  // Close mobile sidebar on route change
  useEffect(() => setMobileOpen(false), [location.pathname])

  const doLogout = () => { logout(); navigate('/login') }

  /* ── Sidebar content ── */
  const Sidebar = ({ mobile = false }) => (
    <aside className={`sidebar${collapsed && !mobile ? ' collapsed' : ''}${mobile && mobileOpen ? ' open' : ''}`}
      style={mobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 200, background: 'var(--gray-950)' } : {}}>

      {/* Brand */}
      <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: collapsed && !mobile ? '0 20px' : '0 18px', gap: 10, borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '.9rem' }}>🤰</span>
        </div>
        {(!collapsed || mobile) && (
          <span style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff', letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
            Momi<span style={{ color: 'var(--red-muted)' }}>Care</span>
          </span>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="btn btn-icon" style={{ marginLeft: 'auto', color: 'var(--gray-400)', background: 'rgba(255,255,255,.06)' }}>
            <Icon d={ICONS.x} size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {items.map(item => {
          const active = isActive(item.to)
          return (
            <Link key={item.to} to={item.to}
              title={collapsed && !mobile ? t(item.labelKey) : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed && !mobile ? '9px 12px' : '9px 12px',
                borderRadius: 8, marginBottom: 2,
                color: active ? '#fff' : 'var(--gray-400)',
                background: active ? 'rgba(192,0,26,.80)' : 'transparent',
                textDecoration: 'none',
                fontSize: '.8375rem', fontWeight: active ? 600 : 450,
                transition: 'all var(--t-fast)',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? '#fff' : 'var(--gray-400)' }}
            >
              <span style={{ flexShrink: 0 }}><Icon d={ICONS[item.icon]} size={17} /></span>
              {(!collapsed || mobile) && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(item.labelKey)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + collapse */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 8px', flexShrink: 0 }}>
        {(!collapsed || mobile) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.05)', marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.78rem', flexShrink: 0 }}>
              {auth?.role?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ROLE_LABEL[auth?.role] ?? auth?.role}
              </div>
            </div>
            <button onClick={doLogout} className="btn btn-icon" title="Chiqish"
              style={{ color: 'var(--gray-500)', background: 'none', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gray-300)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-500)'}
            >
              <Icon d={ICONS.logout} size={15} />
            </button>
          </div>
        )}

        <button onClick={() => setCollapsed(c => !c)} className="hide-mobile"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            width: '100%', padding: '6px 10px', background: 'none', border: 'none',
            color: 'var(--gray-600)', cursor: 'pointer', borderRadius: 6,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gray-300)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-600)'}
        >
          <Icon d={collapsed ? ICONS.chevR : ICONS.chevL} size={15} />
        </button>
      </div>
    </aside>
  )

  return (
    <div className="app-root">

      {/* Desktop sidebar */}
      <div className="hide-mobile"><Sidebar /></div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 199 }} className="a-fadeIn hide-desktop" />
      )}
      <div className="hide-desktop"><Sidebar mobile /></div>

      {/* Main area */}
      <div className="main">

        {/* Topbar */}
        <header className="topbar">
          {/* Mobile menu toggle */}
          <button className="btn btn-icon btn-ghost hide-desktop" onClick={() => setMobileOpen(true)}>
            <Icon d={ICONS.menu} size={20} />
          </button>

          {/* Breadcrumb / title */}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '.8375rem', fontWeight: 600, color: 'var(--text-2)' }}>
              {items.find(n => isActive(n.to)) ? t(items.find(n => isActive(n.to)).labelKey) : 'MomiCare'}
            </span>
          </div>

          {/* Search (desktop) */}
          <div className="hide-mobile" style={{ position: 'relative', width: 220 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <Icon d={ICONS.search} size={14} />
            </span>
            <input className="input input-sm" placeholder={t('common.search')} style={{ paddingLeft: 30 }} />
          </div>

          <LangSwitcher />

          {/* Avatar */}
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: 'default', flexShrink: 0 }}>
            {auth?.role?.[0]?.toUpperCase() ?? 'U'}
          </div>

          <button onClick={doLogout} className="btn btn-ghost btn-sm hide-mobile">
            {t('common.signOut')}
          </button>
        </header>

        {/* Page content */}
        <div className="content">
          <div className="content-inner a-fadeUp">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {items.map(item => {
          const active = isActive(item.to)
          return (
            <Link key={item.to} to={item.to} className={`bnav-item${active ? ' active' : ''}`}>
              <span className="bnav-icon"><Icon d={ICONS[item.icon]} size={20} /></span>
              <span>{item.mobileLabel}</span>
            </Link>
          )
        })}
        <button className="bnav-item" onClick={doLogout}>
          <span className="bnav-icon"><Icon d={ICONS.logout} size={20} /></span>
          <span>Chiqish</span>
        </button>
      </nav>
    </div>
  )
}
