import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import { parseVoiceText, parseVoiceAudio, submitReading, getInstructions } from '../api/patients'

const RISK_CONF = {
  Low:      { label: 'Low Risk',  color: 'var(--green)',  bg: 'var(--green-bg)',  border: '#bbf7d0', icon: '✓' },
  Moderate: { label: 'Moderate',  color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: '#fde68a', icon: '⚠' },
  High:     { label: 'High Risk', color: 'var(--rose)',   bg: 'var(--rose-bg)',   border: '#fecdd3', icon: '⚡' },
  Critical: { label: 'Critical',  color: 'var(--red)',    bg: 'var(--red-subtle)',border: 'var(--red-muted)', icon: '🚨' },
}

const FEELING_OPTS = [
  { v: 'Good',        e: '😊', l: 'Yaxshi'        },
  { v: 'A bit off',   e: '😐', l: 'Biroz noqulay'  },
  { v: 'Unwell',      e: '😔', l: 'Yomon'          },
  { v: 'Very unwell', e: '😰', l: 'Juda yomon'     },
]
const SYMPTOM_OPTS = [
  { v: 'Headache',       l: 'Bosh og\'rig\'i'     },
  { v: 'Dizziness',      l: 'Bosh aylanishi'       },
  { v: 'Swelling',       l: 'Shishish'             },
  { v: 'Blurred vision', l: 'Ko\'z xiralashuvi'   },
  { v: 'Nausea',         l: 'Ko\'ngil aynash'     },
]

const STEPS = ['Holat', 'Qon bosimi', 'Yurak', 'Natija']
const S = { FEELING: 0, BP: 1, HR: 2, CONFIRM: 'confirm', RESULT: 'result' }

export default function CheckinPage() {
  const { auth }  = useAuth()
  const { t }     = useLang()
  const pid       = auth?.patientId

  const [step,       setStep]       = useState(S.FEELING)
  const [feeling,    setFeeling]    = useState('')
  const [symptoms,   setSymptoms]   = useState([])
  const [bp,         setBp]         = useState('')
  const [hr,         setHr]         = useState('')
  const [parsed,     setParsed]     = useState(null)
  const [transcript, setTranscript] = useState('')
  const [voiceText,  setVoiceText]  = useState('')
  const [riskRes,    setRiskRes]    = useState(null)
  const [instruct,   setInstruct]   = useState(null)
  const [err,        setErr]        = useState('')
  const [busy,       setBusy]       = useState(false)
  const [recording,  setRecording]  = useState(false)
  const mediaRef = useRef(null); const chunks = useRef([])

  const stepIdx = typeof step === 'number' ? step : 3
  const progress = Math.round((stepIdx / 3) * 100)

  /* voice */
  async function startRec() {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec    = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = e => chunks.current.push(e.data)
      rec.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        stream.getTracks().forEach(x => x.stop())
        setBusy(true)
        try {
          const r = await parseVoiceAudio(pid, blob)
          setTranscript(r.data.rawTranscript ?? '')
          setBp(r.data.bloodPressure ?? '')
          setHr(r.data.heartRate ? String(r.data.heartRate) : '')
          goConfirm(r.data.bloodPressure, r.data.heartRate)
        } catch { setErr(t('common.error')) }
        finally   { setBusy(false) }
      }
      rec.start(); mediaRef.current = rec; setRecording(true)
    } catch { setErr('Mikrofon topilmadi') }
  }
  function stopRec() { mediaRef.current?.stop(); setRecording(false) }

  async function parseVText() {
    if (!voiceText.trim()) return; setBusy(true)
    try {
      const r = await parseVoiceText(pid, voiceText)
      setTranscript(voiceText)
      setBp(r.data.bloodPressure ?? '')
      setHr(r.data.heartRate ? String(r.data.heartRate) : '')
      goConfirm(r.data.bloodPressure, r.data.heartRate)
    } catch { setErr(t('common.error')) }
    finally   { setBusy(false) }
  }

  function goConfirm(bpVal, hrVal) {
    const syms = symptoms.filter(s => s !== 'None')
    setParsed({ bloodPressure: (bpVal ?? bp) || null, heartRate: hrVal ? parseInt(hrVal) : (hr ? parseInt(hr) : null), symptoms: syms.join(', ') || null, source: 'patient' })
    setStep(S.CONFIRM)
  }

  async function save() {
    setBusy(true); setErr('')
    try {
      const r  = await submitReading(pid, parsed)
      setRiskRes(r.data)
      try { const ins = await getInstructions(pid); setInstruct(ins.data) } catch {}
      setStep(S.RESULT)
    } catch (e) { setErr(e.response?.data?.error ?? t('common.error')) }
    finally      { setBusy(false) }
  }

  function restart() {
    setStep(S.FEELING); setFeeling(''); setSymptoms([])
    setBp(''); setHr(''); setParsed(null); setRiskRes(null); setInstruct(null)
    setErr(''); setTranscript(''); setVoiceText('')
  }

  /* ── render ── */
  return (
    <div style={{ maxWidth: 560 }}>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Kunlik nazorat</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Bugungi holatni qayd eting — 2 daqiqa yetarli</p>
      </div>

      {/* Step progress */}
      {typeof step === 'number' && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === STEPS.length - 1 ? 'flex-end' : 'center', flex: 1, gap: 4 }}>
                <div className={`step-dot ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'}`} style={{ width: 26, height: 26, fontSize: '.72rem' }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '.65rem', color: i === stepIdx ? 'var(--text)' : 'var(--text-3)', fontWeight: i === stepIdx ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ── STEP 0: Feeling ── */}
      {step === S.FEELING && (
        <div className="a-fadeUp">
          <div className="card" style={{ padding: '24px', marginBottom: 12 }}>
            <h3 style={{ marginBottom: 18, fontSize: '.9375rem' }}>Bugun o'zingizni qanday his qilyapsiz?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {FEELING_OPTS.map(opt => (
                <button key={opt.v} onClick={() => setFeeling(opt.v)} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: feeling === opt.v ? 'var(--red)' : 'var(--bg-subtle)',
                  border: `1.5px solid ${feeling === opt.v ? 'var(--red)' : 'var(--border)'}`,
                  color: feeling === opt.v ? '#fff' : 'var(--text)',
                  fontWeight: feeling === opt.v ? 600 : 400,
                  fontSize: '.8375rem', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 9,
                  transition: 'all var(--t-fast)',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{opt.e}</span>{opt.l}
                </button>
              ))}
            </div>

            {feeling && feeling !== 'Good' && (
              <div className="a-fadeIn" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, fontSize: '.8375rem', marginBottom: 11 }}>Qanday belgilar bor?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SYMPTOM_OPTS.map(s => {
                    const sel = symptoms.includes(s.v)
                    return (
                      <button key={s.v} onClick={() => setSymptoms(prev => sel ? prev.filter(x => x !== s.v) : [...prev, s.v])} style={{
                        padding: '5px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                        background: sel ? 'var(--red-subtle)' : 'var(--bg-subtle)',
                        border: `1.5px solid ${sel ? 'var(--red-muted)' : 'var(--border)'}`,
                        color: sel ? 'var(--red-dark)' : 'var(--text-2)',
                        fontWeight: sel ? 600 : 400, fontSize: '.8rem',
                        transition: 'all var(--t-fast)',
                      }}>
                        {sel ? '✓ ' : ''}{s.l}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-full" style={{ padding: '11px' }} disabled={!feeling} onClick={() => setStep(S.BP)}>
            Davom etish →
          </button>
        </div>
      )}

      {/* ── STEP 1: Blood Pressure ── */}
      {step === S.BP && (
        <div className="a-fadeUp">
          <div className="card" style={{ padding: '24px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-subtle)', border: '1px solid var(--red-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💉</div>
              <div>
                <h3 style={{ fontSize: '.9375rem', marginBottom: 2 }}>Qon bosimi</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>Format: 120/80</p>
              </div>
            </div>
            <div className="field">
              <label className="label">Qon bosimi (ixtiyoriy)</label>
              <input className="input input-lg" value={bp} onChange={e => setBp(e.target.value)}
                placeholder="120/80" autoFocus style={{ fontFamily: 'monospace', letterSpacing: '.04em', fontSize: '1.1rem' }} />
            </div>

            {/* Voice shortcut */}
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Ovozli kiritish</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {!recording
                  ? <button className="btn btn-secondary btn-sm" onClick={startRec} disabled={busy}>🎙 Yozishni boshlash</button>
                  : <button className="btn btn-danger btn-sm" onClick={stopRec} style={{ animation: '_pulse-ring 1.4s ease-in-out infinite' }}>⏹ To'xtatish</button>
                }
                {recording && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--rose)', fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rose)', animation: '_blink-dot 1.2s ease-in-out infinite', display: 'inline-block' }} /> Yozilmoqda…</span>}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <input className="input input-sm" value={voiceText} onChange={e => setVoiceText(e.target.value)} placeholder="Qon bosimi 130 ga 85, yurak urishi 88…" style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={parseVText} disabled={busy || !voiceText.trim()}>→</button>
              </div>
            </div>
          </div>

          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => setStep(S.FEELING)}>← Orqaga</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '11px' }} onClick={() => setStep(S.HR)}>Davom etish →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Heart Rate ── */}
      {step === S.HR && (
        <div className="a-fadeUp">
          <div className="card" style={{ padding: '24px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-subtle)', border: '1px solid var(--red-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💓</div>
              <div>
                <h3 style={{ fontSize: '.9375rem', marginBottom: 2 }}>Yurak urishi</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>Urish/daqiqa</p>
              </div>
            </div>
            <div className="field">
              <label className="label">Yurak urishi (ixtiyoriy)</label>
              <input className="input input-lg" type="number" value={hr} onChange={e => setHr(e.target.value)}
                placeholder="72" autoFocus style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '.06em' }} />
            </div>
          </div>

          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => setStep(S.BP)}>← Orqaga</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '11px' }} onClick={() => goConfirm(bp, hr)}>Ko'rib chiqish →</button>
          </div>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {step === S.CONFIRM && parsed && (
        <div className="a-fadeUp">
          <div className="card" style={{ padding: '24px', marginBottom: 12 }}>
            <h3 style={{ marginBottom: 5, fontSize: '.9375rem' }}>Ma'lumotni tasdiqlang</h3>
            <p style={{ color: 'var(--text-3)', fontSize: '.8rem', marginBottom: 20 }}>Saqlashdan avval tekshiring</p>

            {transcript && (
              <div style={{ padding: '9px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: 16, fontStyle: 'italic' }}>
                🎙 "{transcript}"
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { label: 'Qon bosimi', key: 'bloodPressure', placeholder: '120/80',  type: 'text',   mono: true  },
                { label: 'Yurak urishi (bpm)', key: 'heartRate', placeholder: '72', type: 'number', mono: true  },
                { label: 'Belgilar',   key: 'symptoms',     placeholder: '…',        type: 'text',   mono: false },
              ].map(f => (
                <div key={f.key} className="field">
                  <label className="label">{f.label}</label>
                  <input type={f.type} className={`input${f.mono ? ' mono' : ''}`} value={parsed[f.key] ?? ''}
                    onChange={e => setParsed(p => ({ ...p, [f.key]: e.target.value || null }))}
                    placeholder={f.placeholder} />
                </div>
              ))}
            </div>
          </div>

          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn btn-secondary" onClick={() => setStep(S.HR)}>← Orqaga</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '11px' }} onClick={save} disabled={busy}>
              {busy ? <><span className="spin" /> Saqlanmoqda…</> : '✓ Saqlash'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === S.RESULT && riskRes && (() => {
        const rc = RISK_CONF[riskRes.riskLevel] ?? RISK_CONF.Low
        return (
          <div className="a-popIn">
            {/* Risk card */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: 3, background: rc.color }} />
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    {rc.icon}
                  </div>
                  <div>
                    <span className={`badge badge-${riskRes.riskLevel.toLowerCase()} text-base`} style={{ fontSize: '.875rem', padding: '4px 12px', marginBottom: 6, display: 'inline-flex' }}>
                      {rc.label}
                    </span>
                    <p style={{ fontSize: '.8rem', color: 'var(--text-2)', marginTop: 2 }}>
                      Tendensiya: <strong>{riskRes.trend}</strong>
                    </p>
                  </div>
                </div>

                {(riskRes.keyFactors ?? []).length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 9 }}>Asosiy omillar</p>
                    {riskRes.keyFactors.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < riskRes.keyFactors.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '.8125rem', color: 'var(--text)' }}>
                        <span style={{ color: rc.color, flexShrink: 0 }}>•</span>{f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            {instruct && (
              <div className="card a-fadeIn" style={{ overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '14px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '.875rem', margin: 0 }}>💊 Ko'rsatmalar</h3>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: 12 }}>{instruct.headline}</p>
                  {(instruct.tips ?? []).map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: '.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <p style={{ fontSize: '.8125rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary btn-full" style={{ padding: '11px' }} onClick={restart}>
              💗 Yangi nazorat
            </button>
          </div>
        )
      })()}
    </div>
  )
}

const ErrBox = ({ msg }) => (
  <div className="a-fadeIn" style={{ margin: '10px 0', padding: '9px 12px', background: 'var(--rose-bg)', border: '1px solid #fecdd3', borderRadius: 8, color: 'var(--rose)', fontSize: '.8125rem' }}>
    ⚠ {msg}
  </div>
)