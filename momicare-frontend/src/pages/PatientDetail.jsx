import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPatient, getRiskHistory, getAiChecks } from '../api/patients'
import { getAlerts, updateAlert } from '../api/alerts'
import { useLang } from '../i18n/LangContext'
import SketchLineChart from '../components/SketchLineChart'

const RO  = { Low: 0, Moderate: 1, High: 2, Critical: 3 }
const RCL = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }
const RIC = { Critical: '🚨', High: '⚡', Moderate: '⚠', Low: '✓' }
const ALB = { Critical: 'var(--red)', High: 'var(--rose)', Moderate: 'var(--amber)', Low: 'var(--green)' }

export default function PatientDetail() {
  const { id }    = useParams()
  const nav       = useNavigate()
  const { t }     = useLang()
  const [patient, setPatient]  = useState(null)
  const [history, setHistory]  = useState([])
  const [ai,      setAi]       = useState([])
  const [alerts,  setAlerts]   = useState([])
  const [loading, setLoading]  = useState(true)
  const [tab,     setTab]      = useState('overview')
  const [updAl,   setUpdAl]    = useState(null)

  useEffect(() => {
    Promise.all([getPatient(id), getRiskHistory(id), getAiChecks(id), getAlerts()])
      .then(([pr, hr, air, al]) => {
        setPatient(pr.data); setHistory(hr.data); setAi(air.data)
        setAlerts(al.data.filter(a => a.patientId === Number(id)))
      })
      .finally(() => setLoading(false))
  }, [id])

  async function patch(alertId, status) {
    setUpdAl(alertId)
    try { await updateAlert(alertId, status); setAlerts(p => p.map(a => a.id === alertId ? { ...a, status } : a)) }
    finally { setUpdAl(null) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}><span className="spin spin-dark" style={{ width: 28, height: 28 }} /></div>
  if (!patient) return <p style={{ color: 'var(--rose)' }}>Bemor topilmadi</p>

  const chartData = history.map(rs => ({ label: new Date(rs.calculatedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }), value: RO[rs.riskLevel] ?? 0 }))
  const latestAi  = ai[0] ?? null
  const activeAl  = alerts.filter(a => a.status !== 'Resolved')
  const resolvedAl= alerts.filter(a => a.status === 'Resolved')

  const TABS = [
    { k: 'overview', l: 'Umumiy'        },
    { k: 'readings', l: 'Ko\'rsatkichlar' },
    { k: 'alerts',   l: `Ogohlantirishlar${activeAl.length ? ` (${activeAl.length})` : ''}` },
    { k: 'ai',       l: 'AI tekshiruv'  },
  ]

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back */}
      <button onClick={() => nav('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}>
        ← Dashboard
      </button>

      {/* Patient header card */}
      <div className="card a-fadeUp" style={{ padding: '20px 22px', marginBottom: 20, background: 'var(--gray-950)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
              {patient.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, marginBottom: 5 }}>{patient.name}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { v: patient.district ?? '—',        icon: '📍' },
                  { v: patient.pregnancyWeek != null ? `${patient.pregnancyWeek}w` : '—', icon: '🤰' },
                  { v: patient.phoneNumber ?? '—',     icon: '📱' },
                ].map((x, i) => (
                  <span key={i} style={{ fontSize: '.74rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {x.icon} {x.v}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flex: 'column', gap: 8, alignItems: 'flex-end' }}>
            <span className={`badge badge-${RCL[patient.currentRiskLevel ?? 'Low']}`} style={{ fontSize: '.875rem', padding: '5px 13px' }}>
              {RIC[patient.currentRiskLevel ?? 'Low']} {patient.currentRiskLevel ?? 'Low'}
            </span>
            {patient.currentTrend && (
              <span style={{ fontSize: '.8rem', color: patient.currentTrend === 'increasing' ? '#fca5a5' : patient.currentTrend === 'decreasing' ? '#86efac' : '#fde68a', marginTop: 6, display: 'block' }}>
                {patient.currentTrend === 'increasing' ? '↑ Yomonlashmoqda' : patient.currentTrend === 'decreasing' ? '↓ Yaxshilanmoqda' : '→ Barqaror'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs a-fadeIn" style={{ marginBottom: 20 }}>
        {TABS.map(tb => <button key={tb.k} className={`tab${tab === tb.k ? ' active' : ''}`} onClick={() => setTab(tb.k)}>{tb.l}</button>)}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="a-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(patient.currentKeyFactors ?? []).length > 0 && (
            <Section title="Xavf omillari">
              {patient.currentKeyFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < patient.currentKeyFactors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: '.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <p style={{ fontSize: '.8375rem', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{f}</p>
                </div>
              ))}
            </Section>
          )}
          {chartData.length > 0 && (
            <Section title="Xavf tarixi grafigi">
              <SketchLineChart data={chartData} width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 80 : 600, 600)} height={180} />
            </Section>
          )}
          {(patient.assignedDoctors ?? []).length > 0 && (
            <Section title="Tayinlangan shifokorlar">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {patient.assignedDoctors.map(d => (
                  <span key={d.id} style={{ padding: '5px 12px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 99, fontSize: '.8125rem', fontWeight: 600 }}>
                    👨‍⚕️ {d.name}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── READINGS ── */}
      {tab === 'readings' && (
        <div className="a-fadeIn card" style={{ overflow: 'hidden' }}>
          {(patient.readings ?? []).length === 0
            ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Ko'rsatkichlar yo'q</p>
            : (
              <table className="table">
                <thead><tr><th>Qon bosimi</th><th>Yurak urishi</th><th>Manba</th><th>Belgilar</th><th>Sana</th></tr></thead>
                <tbody>
                  {(patient.readings ?? []).map((r, i) => (
                    <tr key={r.id} className="a-fadeUp" style={{ animationDelay: `${Math.min(i * .03, .3)}s` }}>
                      <td><span className="mono" style={{ fontWeight: 700, color: 'var(--red)' }}>{r.bloodPressure ?? '—'}</span></td>
                      <td><span className="mono" style={{ fontWeight: 600 }}>{r.heartRate != null ? `${r.heartRate} bpm` : '—'}</span></td>
                      <td><span className="badge badge-neutral">{r.source === 'nurse' ? '👩‍⚕️ Hamshira' : '🤰 Bemor'}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.8rem', color: 'var(--text-2)' }}>
                        {r.symptoms ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: '.78rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{new Date(r.recordedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* ── ALERTS ── */}
      {tab === 'alerts' && (
        <div className="a-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.length === 0 && <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)' }}><div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div><p>Ogohlantirishlar yo'q</p></div>}

          {activeAl.map((a, i) => (
            <div key={a.id} className="a-fadeUp" style={{
              animationDelay: `${i * .05}s`,
              background: 'var(--white)', borderRadius: 10,
              borderLeft: `4px solid ${ALB[a.priority] ?? 'var(--border)'}`,
              padding: '14px 16px', border: '1px solid var(--border)',
              borderLeftWidth: 4, boxShadow: 'var(--shadow-1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
            }}>
              <div>
                <div style={{ display: 'flex', gap: 7, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge badge-${RCL[a.priority]}`}>{a.priority}</span>
                  {(() => {
                    const SB = { Alert: { bg: 'var(--rose-bg)', color: 'var(--rose)', l: '● Faol' }, Reviewed: { bg: 'var(--green-bg)', color: 'var(--green)', l: '✓ Ko\'rildi' }, FollowUpScheduled: { bg: '#ede9fe', color: '#7c3aed', l: '📅 Kuzatuv' }, Resolved: { bg: 'var(--green-bg)', color: 'var(--green)', l: '✓ Hal qilindi' } }
                    const sb = SB[a.status] ?? SB.Alert
                    return <span style={{ padding: '1px 8px', borderRadius: 99, background: sb.bg, color: sb.color, fontSize: '.72rem', fontWeight: 700 }}>{sb.l}</span>
                  })()}
                  {a.needsAiReview && <span className="badge badge-ai">⚑ AI</span>}
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              {a.status !== 'Resolved' && (
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
                  {a.status !== 'Reviewed' && (
                    <button onClick={() => patch(a.id, 'Reviewed')} disabled={updAl === a.id} className="btn btn-secondary btn-sm">
                      {updAl === a.id ? <span className="spin spin-dark" /> : '✓ Ko\'rildi'}
                    </button>
                  )}
                  <button onClick={() => patch(a.id, 'FollowUpScheduled')} disabled={updAl === a.id} className="btn btn-secondary btn-sm">📅</button>
                  <button onClick={() => patch(a.id, 'Resolved')} disabled={updAl === a.id} className="btn btn-success btn-sm">
                    {updAl === a.id ? <span className="spin" /> : 'Hal qilindi'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {resolvedAl.length > 0 && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-3)', padding: '6px 0', userSelect: 'none' }}>
                + {resolvedAl.length} ta hal qilingan
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
                {resolvedAl.map(a => (
                  <div key={a.id} style={{ padding: '9px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', fontSize: '.8rem' }}>
                    <span className={`badge badge-${RCL[a.priority]}`}>{a.priority}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Hal qilindi</span>
                    <span style={{ color: 'var(--text-3)', marginLeft: 'auto', fontSize: '.74rem' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── AI ── */}
      {tab === 'ai' && (
        <div className="a-fadeIn">
          {!latestAi ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
              <h3 style={{ color: 'var(--text-2)', marginBottom: 8, fontSize: '.95rem' }}>AI tekshiruvi mavjud emas</h3>
              <p style={{ fontSize: '.8375rem' }}>Ko'rsatkich kiritilgandan keyin avtomatik bajariladi. API kalitni application.properties da sozlang.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Match banner */}
              <div style={{
                padding: '16px 18px', borderRadius: 12,
                background: latestAi.matchStatus === 'MATCH' ? 'var(--green-bg)' : 'var(--red-subtle)',
                border: `1.5px solid ${latestAi.matchStatus === 'MATCH' ? '#bbf7d0' : 'var(--red-muted)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '1.6rem' }}>{latestAi.matchStatus === 'MATCH' ? '✅' : '⚑'}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '.9375rem', color: latestAi.matchStatus === 'MATCH' ? 'var(--green)' : 'var(--red)' }}>
                      {latestAi.matchStatus === 'MATCH' ? 'AI qoidalar bilan kelishdi' : 'AI farq aniqladi — ko\'rib chiqing'}
                    </h3>
                    <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 3 }}>{new Date(latestAi.checkedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 10, alignItems: 'center' }}>
                  {[
                    { label: 'Qoidalar tizimi', level: latestAi.ruleBasedRiskLevel ?? 'Low' },
                    null,
                    { label: 'Gemini AI', level: latestAi.aiRiskLevel ?? 'Low' },
                  ].map((item, i) => item ? (
                    <div key={i} style={{ padding: '11px', background: 'rgba(255,255,255,.7)', borderRadius: 9, textAlign: 'center' }}>
                      <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>{item.label}</p>
                      <span className={`badge badge-${RCL[item.level]}`} style={{ fontSize: '.8125rem', padding: '4px 12px' }}>{item.level}</span>
                    </div>
                  ) : (
                    <div key={i} style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--text-3)', fontWeight: 600 }}>vs</div>
                  ))}
                </div>
              </div>

              {latestAi.aiReasoning && (
                <Section title="AI izohi">
                  <p style={{ fontSize: '.8375rem', color: 'var(--text)', lineHeight: 1.65, padding: '10px 13px', background: 'var(--bg-subtle)', borderRadius: 8, borderLeft: '3px solid var(--red)', margin: 0 }}>
                    {latestAi.aiReasoning}
                  </p>
                </Section>
              )}

              {ai.length > 1 && (
                <details>
                  <summary style={{ cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-3)', padding: '4px 0', userSelect: 'none' }}>
                    Barcha {ai.length} ta tekshiruv
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
                    {ai.slice(1).map(c => (
                      <div key={c.id} style={{ padding: '9px 13px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className={`badge badge-${RCL[c.aiRiskLevel ?? 'Low']}`}>{c.aiRiskLevel}</span>
                        <span style={{ padding: '1px 8px', borderRadius: 99, background: c.matchStatus === 'MATCH' ? 'var(--green-bg)' : 'var(--rose-bg)', color: c.matchStatus === 'MATCH' ? 'var(--green)' : 'var(--rose)', fontSize: '.72rem', fontWeight: 700 }}>{c.matchStatus}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '.74rem', color: 'var(--text-3)' }}>{new Date(c.checkedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <p style={{ fontWeight: 700, fontSize: '.8125rem', color: 'var(--text)', margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}
