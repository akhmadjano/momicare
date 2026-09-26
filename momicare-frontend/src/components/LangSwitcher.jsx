import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../i18n/LangContext'

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'English'   },
  { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
  { code: 'ru', flag: '🇷🇺', label: 'Русский'   },
]

export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)
  const cur = LANGS.find(l => l.code === lang) ?? LANGS[0]

  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        className="btn btn-secondary btn-sm"
        style={{ gap: 5, minWidth: 60 }}>
        <span style={{ fontSize: '.9rem' }}>{cur.flag}</span>
        <span style={{ fontSize: '.75rem', fontWeight: 600 }}>{cur.code.toUpperCase()}</span>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ marginLeft: 1, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 4l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="a-scaleIn" style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-3)', boxShadow: 'var(--shadow-4)',
          overflow: 'hidden', minWidth: 140, zIndex: 999,
        }}>
          {LANGS.map(l => {
            const active = l.code === lang
            return (
              <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '9px 13px',
                  background: active ? 'var(--bg-subtle)' : 'transparent',
                  border: 'none', fontFamily: 'inherit',
                  fontSize: '.8125rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--red)' : 'var(--text)',
                  cursor: 'pointer',
                  borderLeft: active ? '2px solid var(--red)' : '2px solid transparent',
                  transition: 'background .1s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: '.95rem' }}>{l.flag}</span>
                <span>{l.label}</span>
                {active && <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--red-dark)' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
