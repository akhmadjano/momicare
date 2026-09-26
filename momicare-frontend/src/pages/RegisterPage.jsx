import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LangSwitcher from '../components/LangSwitcher'

const STEPS = ['Ism', 'Telefon', 'Tayyor']

export default function RegisterPage() {
  const { login }  = useAuth()
  const { t }      = useLang()
  const navigate   = useNavigate()
  const [form, setForm] = useState({ name: '', phoneNumber: '' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const step = form.name.trim() ? (form.phoneNumber.trim() ? 2 : 1) : 0

  const submit = async e => {
    e?.preventDefault()
    if (!form.name.trim() || !form.phoneNumber.trim()) return
    setErr(''); setBusy(true)
    try {
      const r = await register(form); login(r.data)
      setDone(true); setTimeout(() => navigate('/checkin'), 1200)
    }
    catch (e) { setErr(e.response?.data?.error ?? t('common.error')) }
    finally   { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', padding: '24px 20px' }}>

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <LangSwitcher />
      </div>

      <div className="a-fadeUp" style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '.9rem' }}>🤰</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.02em' }}>
            Momi<span style={{ color: 'var(--red)' }}>Care</span>
          </span>
        </div>

        {done ? (
          /* Success screen */
          <div className="card card-p a-popIn" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-bg)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.75rem' }}>
              ✅
            </div>
            <h2 style={{ marginBottom: 8 }}>Hisob yaratildi!</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Yo'naltirilmoqda…</p>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <span className="spin spin-dark" style={{ width: 20, height: 20 }} />
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>

            {/* Step header */}
            <div style={{ padding: '24px 24px 0' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em' }}>Hisob yaratish</h1>
              <p style={{ color: 'var(--text-2)', fontSize: '.875rem', marginBottom: 22 }}>MomiCare ga qo'shiling</p>

              {/* Step bar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, alignItems: 'center' }}>
                {STEPS.map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '.6rem', fontWeight: 600, color: i <= step ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: i < step ? 'var(--red)' : 'var(--border)', transition: 'background .4s', marginBottom: 16 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={submit} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label className="label">👤 {t('auth.fullName')}</label>
                <input className="input input-lg" name="name" value={form.name} onChange={h}
                  placeholder="Malika Yusupova" required autoFocus />
              </div>
              <div className="field">
                <label className="label">📱 {t('auth.phone')}</label>
                <input className="input input-lg" name="phoneNumber" value={form.phoneNumber} onChange={h}
                  type="tel" placeholder="998901234567" required />
                <p style={{ fontSize: '.73rem', color: 'var(--text-3)', marginTop: 4 }}>
                  🔒 Bu raqam kirish uchun ishlatiladi
                </p>
              </div>

              {err && (
                <div className="a-fadeIn" style={{ padding: '9px 12px', background: 'var(--rose-bg)', border: '1px solid #fecdd3', borderRadius: 8, color: 'var(--rose)', fontSize: '.8125rem' }}>
                  ⚠ {err}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-xl btn-full"
                disabled={busy || !form.name.trim() || !form.phoneNumber.trim()}
                style={{ marginTop: 4 }}>
                {busy ? <><span className="spin" /> Yaratilmoqda…</> : 'Hisob yaratish →'}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.8125rem', color: 'var(--text-2)' }}>
          Hisobingiz bormi?{' '}
          <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Kirish →</Link>
        </p>
      </div>
    </div>
  )
}
