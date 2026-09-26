import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../i18n/LangContext'

const LANGS = [
  { code: 'en', flag: '🇬🇧', short: 'EN' },
  { code: 'uz', flag: '🇺🇿', short: 'UZ' },
  { code: 'ru', flag: '🇷🇺', short: 'RU' },
]

export default function LanguageSwitcher() {
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
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 11px', borderRadius: 'var(--r-full)',
        border: '1.5px solid var(--pink-mid)',
        background: 'var(--white)', color: 'var(--t2)',
        fontSize: '.78rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .14s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--magenta)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--pink-mid)'}>
        <span style={{ fontSize: '.9rem' }}>{cur.flag}</span>
        <span>{cur.short}</span>
        <span style={{ fontSize: '.6rem', opacity: .6, transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div className="anim-slideR" style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--white)', border: '1.5px solid var(--pink-mid)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-md)',
          overflow: 'hidden', minWidth: 130, zIndex: 999,
        }}>
          {LANGS.map(l => {
            const active = l.code === lang
            return (
              <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '10px 14px',
                background: active ? 'var(--pink-light)' : 'transparent',
                border: 'none', fontFamily: 'inherit',
                fontSize: '.85rem', fontWeight: active ? 700 : 450,
                color: active ? 'var(--magenta)' : 'var(--t2)',
                cursor: 'pointer',
                borderLeft: active ? '3px solid var(--magenta)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--pink-light)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: '1rem' }}>{l.flag}</span>
                <span>{{ en: 'English', uz: "O'zbekcha", ru: 'Русский' }[l.code]}</span>
                {active && <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--magenta-l)' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
