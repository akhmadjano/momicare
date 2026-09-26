import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../api/patients'
import { getAlerts, updateAlert } from '../api/alerts'
import { useLang } from '../i18n/LangContext'
import SketchLineChart from '../components/SketchLineChart'

const RO  = { Critical: 0, High: 1, Moderate: 2, Low: 3 }
const RCL = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }
const RIC = { Critical: '🚨', High: '⚡', Moderate: '⚠', Low: '✓' }
const ALC = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }

export default function DashboardPage() {
  const { t }      = useLang()
  const [patients, setPatients] = useState([])
  const [alerts,   setAlerts]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [updAl,    setUpdAl]    = useState(null)

  useEffect(() => {
    Promise.all([getPatients(), getAlerts()])
      .then(([pr, ar]) => { setPatients(pr.data); setAlerts(ar.data) })
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    Critical: patients.filter(p => p.currentRiskLevel === 'Critical').length,
    High:     patients.filter(p => p.currentRiskLevel === 'High').length,
    Moderate: patients.filter(p => p.currentRiskLevel === 'Moderate').length,
    Low:      patients.filter(p => !p.currentRiskLevel || p.currentRiskLevel === 'Low').length,
  }

  const sorted   = [...patients].sort((a, b) => (RO[a.currentRiskLevel] ?? 4) - (RO[b.currentRiskLevel] ?? 4))
  const filtered = filter === 'all' ? sorted : sorted.filter(p => (p.currentRiskLevel ?? 'Low') === filter)
  const activeAl = alerts.filter(a => a.status === 'Alert').sort((a, b) => RO[a.priority] - RO[b.priority])

  async function markReviewed(id) {
    setUpdAl(id)
    try { await updateAlert(id, 'Reviewed'); setAlerts(p => p.map(a => a.id === id ? { ...a, status: 'Reviewed' } : a)) }
    finally { setUpdAl(null) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
      <span className="spin spin-dark" style={{ width: 28, height: 28 }} />
    </div>
  )

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>
          {patients.length} ta bemor kuzatilmoqda
          {activeAl.length > 0 && <span style={{ marginLeft: 10, color: 'var(--red)', fontWeight: 600 }}>· {activeAl.length} ta faol ogohlantirish</span>}
        </p>
      </div>

      {/* Stat cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'Critical', bg: 'var(--gray-950)', textColor: '#fff', pulse: true },
          { key: 'High',     bg: 'var(--rose-bg)',   textColor: 'var(--rose)' },
          { key: 'Moderate', bg: 'var(--amber-bg)',  textColor: 'var(--amber)' },
          { key: 'Low',      bg: 'var(--green-bg)',  textColor: 'var(--green)' },
        ].map(s => {
          const active = filter === s.key
          return (
            <button key={s.key} className={`card a-fadeUp${active ? '' : ' card-hover'}`}
              onClick={() => setFilter(active ? 'all' : s.key)}
              style={{
                padding: '16px', cursor: 'pointer', textAlign: 'left',
                background: active ? s.bg : 'var(--white)',
                border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                boxShadow: active ? 'var(--shadow-3)' : 'var(--shadow-1)',
                transition: 'all var(--t-base)', fontFamily: 'inherit',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{RIC[s.key]}</span>
                {s.pulse && counts[s.key] > 0 && active && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'block', animation: '_pulse-ring 2s ease-in-out infinite' }} />
                )}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: active ? (s.key === 'Critical' ? '#fff' : s.textColor) : 'var(--text)', marginBottom: 4 }}>
                {counts[s.key]}
              </div>
              <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: active ? (s.key === 'Critical' ? 'var(--gray-400)' : s.textColor) : 'var(--text-3)' }}>
                {s.key}
              </div>
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: activeAl.length > 0 ? '1fr 300px' : '1fr', gap: 18, alignItems: 'start' }}>

        {/* Patient table */}
        <div className="card a-fadeUp" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '.875rem' }}>
              Bemorlar
              {filter !== 'all' && (
                <span style={{ marginLeft: 8 }}>
                  <span className={`badge badge-${RCL[filter]}`}>{filter}</span>
                  <button onClick={() => setFilter('all')} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '.75rem', fontFamily: 'inherit' }}>✕</button>
                </span>
              )}
            </span>
            <span style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>{filtered.length} ta</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Bemor</th>
                  <th>Tuman</th>
                  <th>Hafta</th>
                  <th>Xavf</th>
                  <th>Tendensiya</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>Ma'lumot topilmadi</td></tr>
                )}
                {filtered.map((p, i) => (
                  <tr key={p.id} className="a-fadeUp" style={{ animationDelay: `${Math.min(i * .03, .3)}s` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.currentRiskLevel === 'Critical' ? 'var(--red)' : 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.currentRiskLevel === 'Critical' ? '#fff' : 'var(--text-2)', fontWeight: 700, fontSize: '.78rem', flexShrink: 0 }}>
                          {p.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <Link to={`/dashboard/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.8375rem', display: 'block' }}>{p.name}</Link>
                          <span style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>{p.phoneNumber ?? ''}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '.8125rem', color: 'var(--text-2)' }}>{p.district ?? '—'}</td>
                    <td>
                      {p.pregnancyWeek != null
                        ? <span className="badge badge-neutral">{p.pregnancyWeek}w</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td>
                      <span className={`badge badge-${RCL[p.currentRiskLevel ?? 'Low']}`}>
                        {RIC[p.currentRiskLevel ?? 'Low']} {p.currentRiskLevel ?? 'Low'}
                      </span>
                    </td>
                    <td>
                      {p.currentTrend && (
                        <span style={{ fontSize: '.8rem', color: p.currentTrend === 'increasing' ? 'var(--rose)' : p.currentTrend === 'decreasing' ? 'var(--green)' : 'var(--amber)' }}>
                          {p.currentTrend === 'increasing' ? '↑' : p.currentTrend === 'decreasing' ? '↓' : '→'} {p.currentTrend}
                        </span>
                      )}
                    </td>
                    <td>
                      <Link to={`/dashboard/${p.id}`} className="btn btn-secondary btn-sm">Ko'rish →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts panel */}
        {activeAl.length > 0 && (
          <div className="card a-fadeRight" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '.875rem' }}>Ogohlantirishlar</span>
              <span className="badge badge-critical">{activeAl.length}</span>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px 10px' }}>
              {activeAl.map(a => (
                <div key={a.id} className={`alert-strip ${ALC[a.priority] ?? ''}`}
                  style={{ borderRadius: 8, marginBottom: 7 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${RCL[a.priority]}`}>{a.priority}</span>
                      {a.needsAiReview && <span className="badge badge-ai">⚑ AI</span>}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{a.patientName}</p>
                    <p style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => markReviewed(a.id)} disabled={updAl === a.id}
                      style={{ padding: '3px 9px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: '.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {updAl === a.id ? <span className="spin" style={{ width: 10, height: 10, borderColor: 'var(--green)', borderTopColor: 'var(--green)' }} /> : '✓'}
                    </button>
                    <Link to={`/dashboard/${a.patientId}`} style={{ padding: '3px 9px', background: 'rgba(0,0,0,.04)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.7rem', fontWeight: 600, textAlign: 'center' }}>
                      →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mini charts for top critical patients */}
      {patients.filter(p => p.currentRiskLevel === 'Critical' || p.currentRiskLevel === 'High').length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Yuqori xavfli bemorlar</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {patients.filter(p => p.currentRiskLevel === 'Critical' || p.currentRiskLevel === 'High').slice(0, 4).map((p, i) => (
              <Link key={p.id} to={`/dashboard/${p.id}`} className="card card-hover a-fadeUp" style={{ padding: '16px', textDecoration: 'none', animationDelay: `${i * .06}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--text)', marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: '.76rem', color: 'var(--text-3)' }}>{p.district ?? '—'} · {p.pregnancyWeek != null ? `${p.pregnancyWeek}w` : '—'}</p>
                  </div>
                  <span className={`badge badge-${RCL[p.currentRiskLevel]}`}>{p.currentRiskLevel}</span>
                </div>
                <SketchLineChart
                  data={[0, 1, 2, RO[p.currentRiskLevel] ?? 0].map((v, idx) => ({ label: ['3h', '2h', '1h', 'Now'][idx], value: Math.min(v, RO[p.currentRiskLevel] ?? 0) }))}
                  width={230} height={80}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
