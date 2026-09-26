import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginByPhone, loginStaff } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LangSwitcher from '../components/LangSwitcher'

const DEMOS = [
  { role: 'Bemor',    hint: '998901234567',      color: '#fee2e2' },
  { role: 'Shifokor', hint: 'doctor1 / demo1234', color: '#ede9fe' },
  { role: 'Hamshira', hint: 'nurse1 / demo1234',  color: '#ecfdf5' },
  { role: 'Admin',    hint: 'admin1 / demo1234',  color: '#fef3c7' },
]

export default function LoginPage() {
  const { login }  = useAuth()
  const { t }      = useLang()
  const navigate   = useNavigate()
  const [tab, setTab]         = useState('patient')
  const [phone, setPhone]     = useState('')
  const [creds, setCreds]     = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [err,  setErr]        = useState('')
  const [busy, setBusy]       = useState(false)

  const submitP = async e => {
    e?.preventDefault(); if (!phone.trim()) return
    setErr(''); setBusy(true)
    try   { const r = await loginByPhone({ phoneNumber: phone }); login(r.data); navigate('/checkin') }
    catch (e) { setErr(e.response?.data?.error ?? t('common.error')) }
    finally   { setBusy(false) }
  }

  const submitS = async e => {
    e?.preventDefault(); if (!creds.username || !creds.password) return
    setErr(''); setBusy(true)
    try   { const r = await loginStaff(creds); login(r.data); navigate(r.data.role === 'nurse' ? '/nurse' : '/dashboard') }
    catch (e) { setErr(e.response?.data?.error ?? t('common.error')) }
    finally   { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-subtle)' }}>
      {/* Left panel — desktop only */}
      <div className="hide-mobile a-fadeRight" style={{
        width: 380, flexShrink: 0, background: 'var(--gray-950)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 40px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem' }}>🤰</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-.02em' }}>
              Momi<span style={{ color: 'var(--red-muted)' }}>Care</span>
            </span>
          </div>

          <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
            Ona va bola sog'lig'ini <span style={{ color: 'var(--red-muted)' }}>kuzating</span>
          </h2>
          <p style={{ color: 'var(--gray-400)', fontSize: '.875rem', lineHeight: 1.7 }}>
            Homiladorlik davridagi xavflarni erta aniqlash, tibbiy jamoani real vaqtda xabardor qilish.
          </p>
        </div>

        <div>
          {['BP monitoring', 'AI tahlil', 'Ogohlantirish', 'Ko\'rsatmalar'].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
              <span style={{ color: 'var(--gray-400)', fontSize: '.8rem' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 20px' }}>

        {/* Top-right controls */}
        <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 10, zIndex: 10 }}>
          <LangSwitcher />
        </div>

        <div className="a-fadeUp" style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile brand */}
          <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '.85rem' }}>🤰</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '.95rem', letterSpacing: '-.02em' }}>
              Momi<span style={{ color: 'var(--red)' }}>Care</span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em' }}>Xush kelibsiz 👋</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '.875rem', marginBottom: 28 }}>Hisobingizga kiring</p>

          {/* Tab toggle */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            <button className={`tab${tab === 'patient' ? ' active' : ''}`} onClick={() => { setTab('patient'); setErr('') }}>🤰 Bemor</button>
            <button className={`tab${tab === 'staff'   ? ' active' : ''}`} onClick={() => { setTab('staff');   setErr('') }}>👩‍⚕️ Xodim</button>
          </div>

          {tab === 'patient' && (
            <form className="a-fadeIn" onSubmit={submitP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label className="label">{t('auth.phone')}</label>
                <input className="input input-lg" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="998 90 123 45 67" required autoFocus />
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--text-3)', padding: '8px 10px', background: 'var(--bg-muted)', borderRadius: 6 }}>
                🔓 Demo uchun parol kerak emas (production da OTP bo'ladi)
              </p>
              {err && <ErrBox msg={err} />}
              <button type="submit" className="btn btn-primary btn-xl btn-full" disabled={busy}>
                {busy ? <><span className="spin" />  Kirilmoqda…</> : 'Kirish →'}
              </button>
            </form>
          )}

          {tab === 'staff' && (
            <form className="a-fadeIn" onSubmit={submitS} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label className="label">{t('auth.username')}</label>
                <input className="input input-lg" value={creds.username} onChange={e => setCreds(c => ({ ...c, username: e.target.value }))}
                  placeholder="nurse1 / doctor1 / admin1" required autoFocus />
              </div>
              <div className="field">
                <label className="label">{t('auth.password')}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input input-lg" type={showPw ? 'text' : 'password'}
                    value={creds.password} onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
                    placeholder="••••••••" required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                    fontSize: '.85rem',
                  }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {err && <ErrBox msg={err} />}
              <button type="submit" className="btn btn-primary btn-xl btn-full" disabled={busy}>
                {busy ? <><span className="spin" /> Kirilmoqda…</> : 'Kirish →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.8125rem', color: 'var(--text-2)' }}>
            Hisob yo'qmi?{' '}
            <Link to="/register" style={{ color: 'var(--red)', fontWeight: 600 }}>Ro'yxatdan o'ting →</Link>
          </p>

          {/* Demo grid */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
              Demo ma'lumotlar
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {DEMOS.map(d => (
                <div key={d.role} style={{ padding: '8px 10px', borderRadius: 8, background: d.color, border: '1px solid rgba(0,0,0,.06)' }}>
                  <div style={{ fontSize: '.76rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: 1 }}>{d.role}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>{d.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ErrBox = ({ msg }) => (
  <div className="a-fadeIn" style={{ padding: '10px 12px', background: 'var(--rose-bg)', border: '1px solid #fecdd3', borderRadius: 8, color: 'var(--rose)', fontSize: '.8125rem', display: 'flex', alignItems: 'center', gap: 7 }}>
    ⚠ {msg}
  </div>
)
