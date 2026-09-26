import React, { useState, useRef, useEffect } from 'react'
import { getPatients, submitReading, parseVoiceText, parseVoiceAudio } from '../api/patients'
import { useLang } from '../i18n/LangContext'

const QK = 'momicare_queue'
const loadQ = () => { try { return JSON.parse(localStorage.getItem(QK) ?? '[]') } catch { return [] } }
const saveQ = q => localStorage.setItem(QK, JSON.stringify(q))
const ST = { FORM: 0, CONFIRM: 1, RESULT: 2 }

const RISK_BADGE = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }

export default function NursePage() {
  const { t }      = useLang()
  const [patients, setPatients] = useState([])
  const [pid,      setPid]      = useState('')
  const [form,     setForm]     = useState({ bp: '', hr: '', symptoms: '' })
  const [step,     setStep]     = useState(ST.FORM)
  const [parsed,   setParsed]   = useState(null)
  const [tx,       setTx]       = useState('')
  const [voiceT,   setVoiceT]   = useState('')
  const [riskRes,  setRiskRes]  = useState(null)
  const [err,      setErr]      = useState('')
  const [busy,     setBusy]     = useState(false)
  const [rec,      setRec]      = useState(false)
  const [offline,  setOffline]  = useState(!navigator.onLine)
  const [queue,    setQueue]    = useState(loadQ)
  const [syncMsg,  setSyncMsg]  = useState('')
  const mRef = useRef(null); const ch = useRef([])

  useEffect(() => {
    getPatients().then(r => setPatients(r.data)).catch(() => {})
    const on  = () => { setOffline(false); sync() }
    const off = () => setOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function sync() {
    const q = loadQ(); if (!q.length) return
    setSyncMsg('Sinxronlanmoqda…')
    const rem = []
    for (const e of q) { try { await submitReading(e.pid, e.reading) } catch { rem.push(e) } }
    saveQ(rem); setQueue(rem)
    setSyncMsg(rem.length === 0 ? '✓ Hammasi yuborildi' : `${rem.length} ta kutmoqda`)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  async function startRec() {
    setErr('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(s)
      ch.current = []
      r.ondataavailable = e => ch.current.push(e.data)
      r.onstop = async () => {
        const b = new Blob(ch.current, { type: 'audio/webm' })
        s.getTracks().forEach(t => t.stop())
        if (!pid) { setErr('Avval bemor tanlang'); return }
        setBusy(true)
        try {
          const res = await parseVoiceAudio(pid, b)
          setTx(res.data.rawTranscript ?? '')
          setParsed({ bloodPressure: res.data.bloodPressure ?? '', heartRate: res.data.heartRate ?? '', symptoms: form.symptoms, source: 'nurse' })
          setStep(ST.CONFIRM)
        } catch { setErr(t('common.error')) }
        finally   { setBusy(false) }
      }
      r.start(); mRef.current = r; setRec(true)
    } catch { setErr('Mikrofon topilmadi') }
  }
  function stopRec() { mRef.current?.stop(); setRec(false) }

  async function parseVT() {
    if (!voiceT.trim() || !pid) return; setBusy(true)
    try {
      const res = await parseVoiceText(pid, voiceT)
      setTx(voiceT)
      setParsed({ bloodPressure: res.data.bloodPressure ?? '', heartRate: res.data.heartRate ?? '', symptoms: form.symptoms, source: 'nurse' })
      setStep(ST.CONFIRM)
    } catch { setErr(t('common.error')) }
    finally   { setBusy(false) }
  }

  async function save() {
    setBusy(true); setErr('')
    const reading = { ...parsed, heartRate: parsed.heartRate ? parseInt(parsed.heartRate) : null }
    if (offline) {
      const q = [...loadQ(), { pid, reading, queuedAt: Date.now() }]
      saveQ(q); setQueue(q); setRiskRes(null); setStep(ST.RESULT); setBusy(false); return
    }
    try { const res = await submitReading(pid, reading); setRiskRes(res.data); setStep(ST.RESULT) }
    catch(e) { setErr(e.response?.data?.error ?? t('common.error')) }
    finally  { setBusy(false) }
  }

  function reset() {
    setStep(ST.FORM); setForm({ bp: '', hr: '', symptoms: '' })
    setParsed(null); setRiskRes(null); setTx(''); setErr(''); setVoiceT('')
  }

  const selP = patients.find(p => p.id === Number(pid))

  return (
    <div style={{ maxWidth: 600 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Ma'lumot kiritish</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Bemorlar vitalllarini qayd eting</p>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 99, border: `1px solid ${offline ? 'var(--amber)' : 'var(--green)'}`, background: offline ? 'var(--amber-bg)' : 'var(--green-bg)', fontSize: '.75rem', fontWeight: 600, color: offline ? 'var(--amber)' : 'var(--green)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: offline ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }} />
            {offline ? 'Oflayn' : 'Onlayn'}
            {queue.length > 0 && ` · ${queue.length}`}
          </div>
          {!offline && queue.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={sync} disabled={busy}>⟳ Sinxronlash</button>
          )}
        </div>
      </div>

      {syncMsg && (
        <div className="a-fadeIn" style={{ padding: '9px 13px', background: syncMsg.includes('✓') ? 'var(--green-bg)' : 'var(--amber-bg)', border: `1px solid ${syncMsg.includes('✓') ? 'var(--green)' : 'var(--amber)'}`, borderRadius: 8, fontSize: '.8125rem', fontWeight: 600, color: syncMsg.includes('✓') ? 'var(--green)' : 'var(--amber)', marginBottom: 16 }}>
          {syncMsg}
        </div>
      )}

      {/* ── FORM ── */}
      {step === ST.FORM && (
        <div className="a-fadeIn" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* Patient selector */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '.875rem', marginBottom: 14 }}>Bemor tanlash</h3>
            <div className="field">
              <label className="label">Bemor</label>
              <select className="input" value={pid} onChange={e => setPid(e.target.value)}
                style={{ cursor: 'pointer' }}>
                <option value="">— Bemor tanlang —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.district ? ` · ${p.district}` : ''}{p.pregnancyWeek ? ` · ${p.pregnancyWeek}w` : ''}</option>
                ))}
              </select>
            </div>

            {selP && (
              <div className="a-fadeIn" style={{ marginTop: 11, display: 'flex', gap: 10, flexWrap: 'wrap', padding: '9px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 600 }}>🤰 {selP.pregnancyWeek ?? '—'}w</span>
                {selP.currentRiskLevel && <span className={`badge badge-${RISK_BADGE[selP.currentRiskLevel]}`}>{selP.currentRiskLevel}</span>}
                <span style={{ fontSize: '.76rem', color: 'var(--text-3)' }}>📍 {selP.district ?? '—'}</span>
              </div>
            )}
          </div>

          {/* Vitals */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '.875rem', marginBottom: 16 }}>Vitalllar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 13 }}>
              <div className="field">
                <label className="label">Qon bosimi</label>
                <input className="input mono" value={form.bp} onChange={e => setForm(f => ({ ...f, bp: e.target.value }))} placeholder="120/80" />
              </div>
              <div className="field">
                <label className="label">Yurak urishi (bpm)</label>
                <input className="input mono" type="number" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: e.target.value }))} placeholder="72" />
              </div>
            </div>
            <div className="field">
              <label className="label">Belgilar / Kuzatuvlar</label>
              <input className="input" value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="Belgilar, kuzatuvlar…" />
            </div>
          </div>

          {/* Voice entry */}
          <div className="card" style={{ padding: '18px' }}>
            <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Tez ovozli kiritish</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {!rec
                ? <button className="btn btn-secondary btn-sm" onClick={startRec} disabled={busy || !pid}>🎙 Boshlash</button>
                : <button className="btn btn-danger btn-sm" onClick={stopRec}>⏹ To'xtatish</button>
              }
              {rec && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--rose)', fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rose)', display: 'inline-block', animation: '_blink-dot 1.2s ease-in-out infinite' }} /> Yozilmoqda…</span>}
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <input className="input input-sm" value={voiceT} onChange={e => setVoiceT(e.target.value)} placeholder="Qon bosimi 130 ga 85, yurak urishi 88…" style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={parseVT} disabled={busy || !voiceT.trim() || !pid} style={{ flexShrink: 0 }}>→</button>
            </div>
          </div>

          {err && <ErrBox msg={err} />}
          <button className="btn btn-primary btn-full" style={{ padding: '11px' }} disabled={!pid} onClick={() => {
            setParsed({ bloodPressure: form.bp || null, heartRate: form.hr ? parseInt(form.hr) : null, symptoms: form.symptoms || null, source: 'nurse' })
            setStep(ST.CONFIRM)
          }}>
            Ko'rib chiqish →
          </button>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {step === ST.CONFIRM && parsed && (
        <div className="a-fadeUp">
          <div className="card" style={{ padding: '22px', marginBottom: 14 }}>
            <h3 style={{ marginBottom: 5, fontSize: '.9375rem' }}>Tasdiqlash</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '.8rem', marginBottom: 18 }}>Bemorga qo'shishdan avval tekshiring</p>

            {tx && <div style={{ padding: '9px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: 16, fontStyle: 'italic' }}>🎙 "{tx}"</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 13 }}>
              {[
                { label: 'Qon bosimi', key: 'bloodPressure', type: 'text',   ph: '120/80', mono: true },
                { label: 'Yurak urishi', key: 'heartRate',   type: 'number', ph: '72',    mono: true },
              ].map(f => (
                <div key={f.key} className="field">
                  <label className="label">{f.label}</label>
                  <input type={f.type} className={`input${f.mono ? ' mono' : ''}`} value={parsed[f.key] ?? ''}
                    onChange={e => setParsed(p => ({ ...p, [f.key]: e.target.value || null }))} placeholder={f.ph} />
                </div>
              ))}
            </div>
            <div className="field">
              <label className="label">Belgilar</label>
              <input className="input" value={parsed.symptoms ?? ''} onChange={e => setParsed(p => ({ ...p, symptoms: e.target.value || null }))} placeholder="…" />
            </div>
          </div>

          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn btn-secondary" onClick={() => setStep(ST.FORM)}>← Orqaga</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '11px' }} onClick={save} disabled={busy}>
              {busy ? <><span className="spin" /> Saqlanmoqda…</> : offline ? '📥 Navbatga qo\'yish' : '✓ Saqlash'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === ST.RESULT && (
        <div className="a-popIn">
          <div className="card" style={{ padding: '24px', marginBottom: 14 }}>
            {riskRes ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--green-bg)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>✅</div>
                  <div>
                    <h3 style={{ marginBottom: 5 }}>Ma'lumot saqlandi!</h3>
                    <span className={`badge badge-${RISK_BADGE[riskRes.riskLevel] ?? 'low'}`} style={{ fontSize: '.8rem', padding: '4px 11px' }}>
                      {riskRes.riskLevel}
                    </span>
                    <p style={{ fontSize: '.8rem', color: 'var(--text-2)', marginTop: 6 }}>Tendensiya: <strong>{riskRes.trend}</strong></p>
                  </div>
                </div>
                {(riskRes.keyFactors ?? []).length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    {riskRes.keyFactors.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: '.8rem', color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0 }}>•</span>{f}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📥</div>
                <h3 style={{ marginBottom: 6 }}>Navbatga qo'yildi</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>{queue.length} ta kiritish sinxronlanishni kutmoqda</p>
              </div>
            )}
          </div>

          {/* Queue preview */}
          {queue.length > 0 && (
            <div className="card a-fadeIn" style={{ overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>Oflayn navbat</p>
                <span className="badge badge-neutral">{queue.length}</span>
              </div>
              {queue.slice(0, 3).map((e, i) => (
                <div key={i} style={{ padding: '9px 16px', borderBottom: i < Math.min(queue.length, 3) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12, fontSize: '.8rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>#{e.pid}</span>
                  <span style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>BP: {e.reading.bloodPressure ?? '—'} · HR: {e.reading.heartRate ?? '—'}</span>
                </div>
              ))}
              {queue.length > 3 && <div style={{ padding: '8px 16px', fontSize: '.78rem', color: 'var(--text-3)' }}>+{queue.length - 3} ta boshqa</div>}
            </div>
          )}

          <button className="btn btn-primary btn-full" style={{ padding: '11px' }} onClick={reset}>＋ Yangi yozuv</button>
        </div>
      )}
    </div>
  )
}

const ErrBox = ({ msg }) => (
  <div className="a-fadeIn" style={{ padding: '9px 12px', background: 'var(--rose-bg)', border: '1px solid #fecdd3', borderRadius: 8, color: 'var(--rose)', fontSize: '.8125rem' }}>⚠ {msg}</div>
)
