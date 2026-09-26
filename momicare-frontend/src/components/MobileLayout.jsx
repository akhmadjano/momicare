import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LanguageSwitcher from './LanguageSwitcher'

/* Role → bottom nav tabs */
const TABS = {
  patient: [
    { to: '/checkin',     icon: '💗', labelKey: 'nav.checkin'    },
    { to: '/my-activity', icon: '📋', labelKey: 'nav.myActivity' },
  ],
  nurse: [
    { to: '/nurse', icon: '🩺', labelKey: 'nav.dataEntry' },
  ],
  doctor: [
    { to: '/dashboard', icon: '📊', labelKey: 'nav.dashboard' },
  ],
  admin: [
    { to: '/dashboard',         icon: '📊', labelKey: 'nav.dashboard'   },
    { to: '/regional',          icon: '🗺',  labelKey: 'nav.regional'    },
    { to: '/admin/assignments', icon: '👩‍⚕️', labelKey: 'nav.assignments' },
  ],
}

/* Page title from path */
function usePageTitle(role, t) {
  const location = useLocation()
  const p = location.pathname
  if (p === '/checkin')            return t('checkin.title')
  if (p === '/my-activity')        return t('activity.title')
  if (p === '/nurse')              return t('nurse.title')
  if (p.startsWith('/dashboard/')) return t('detail.overview')
  if (p === '/dashboard')          return t('dashboard.title')
  if (p === '/regional')           return t('regional.title')
  if (p === '/admin/assignments')  return t('assignments.title')
  return 'MomiCare'
}

export default function MobileLayout({ children }) {
  const { auth, logout } = useAuth()
  const { t }            = useLang()
  const navigate         = useNavigate()
  const location         = useLocation()
  const tabs             = TABS[auth?.role] ?? []
  const title            = usePageTitle(auth?.role, t)

  const isActive = to => {
    if (to === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')
    return location.pathname.startsWith(to)
  }

  return (
    <div className="app-wrap">

      {/* ── Top Nav ── */}
      <nav className="m-nav">
        <Link to="/" className="m-nav-brand">
          <span style={{ fontSize: '1.3rem' }}>🤰</span>
          MomiCare
        </Link>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--t2)' }}>{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          <button onClick={() => { logout(); navigate('/login') }} style={{
            background: 'var(--pink-light)', border: '1.5px solid var(--pink-mid)',
            borderRadius: 'var(--r-full)', padding: '5px 12px',
            fontSize: '.76rem', fontWeight: 700, color: 'var(--t2)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .14s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--magenta)'; e.currentTarget.style.color = 'var(--magenta)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--pink-mid)'; e.currentTarget.style.color = 'var(--t2)' }}>
            {t('common.signOut')}
          </button>
        </div>
      </nav>

      {/* ── Page content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="page">
          {children}
        </div>
      </div>

      {/* ── Bottom Tab Bar ── */}
      {tabs.length > 0 && (
        <nav className="bottom-nav">
          {tabs.map(tb => {
            const active = isActive(tb.to)
            return (
              <Link key={tb.to} to={tb.to} className={`bottom-nav-item${active ? ' active' : ''}`}>
                <span className="bnav-icon">{tb.icon}</span>
                <span>{t(tb.labelKey)}</span>
              </Link>
            )
          })}
          {/* Profile/settings shortcut */}
          <button className="bottom-nav-item" onClick={() => { logout(); navigate('/login') }}
            style={{ border: 'none', background: 'none' }}>
            <span className="bnav-icon">👤</span>
            <span>{t('common.signOut')}</span>
          </button>
        </nav>
      )}
    </div>
  )
}
