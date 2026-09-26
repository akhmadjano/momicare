import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import { getActivity, getRiskHistory, getInstructions } from '../api/patients'
import SketchLineChart from '../components/SketchLineChart'

const RISK_ORD = { Low: 0, Moderate: 1, High: 2, Critical: 3 }
const RISK_BADGE = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }
const PAGE = 10

const ACT = {
  checkin:     { icon: '💗', label: 'Nazorat',       color: 'var(--red)' },
  reading:     { icon: '📋', label: 'Ko\'rsatkich',  color: '#7c3aed'    },
  login:       { icon: '🔑', label: 'Kirish',        color: 'var(--amber)' },
  alert_viewed:{ icon: '🔔', label: 'Ogohlantirish', color: 'var(--rose)'  },
}

const INSTR_LEVEL = (h) => {
  const t = (h ?? '').toLowerCase()
  if (t.includes('emergency') || t.includes('immediately') || t.includes('zudlik')) return 'Critical'
  if (t.includes('today') || t.includes('bugun')) return 'High'
  if (t.includes('24') || t.includes('48')) return 'Moderate'
  return 'Low'
}

export default function MyActivityPage() {
  const { auth }  = useAuth()
  const { t }     = useLang()
  const pid       = auth?.patientId

  const [logs,    setLogs]    = useState([])
  const [offset,  setOffset]  = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [history, setHistory] = useState([])
  const [instruct,setInstruct]= useState(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setML]  = useState(false)
  const [tab,     setTab]     = useState('timeline')

  useEffect(() => {
    if (!pid) return
    Promise.all([getActivity(pid, PAGE, 0), getRiskHistory(pid), getInstructions(pid)])
      .then(([ar, hr, ir]) => {
        setLogs(ar.data); setHasMore(ar.data.length === PAGE)
        setHistory(hr.data); setInstruct(ir.data)
      })
      .finally(() => setLoading(false))
  }, [pid])

  const loadMore = useCallback(async () => {
    setML(true)
    const newOff = offset + PAGE
    try {
      const r = await getActivity(pid, PAGE, newOff)
      setLogs(p => [...p, ...r.data]); setOffset(newOff); setHasMore(r.data.length === PAGE)
    } finally { setML(false) }
  }, [pid, offset])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <span className="spin spin-dark" style={{ width: 26, height: 26 }} />
    </div>
  )

  const chartData = history.map(rs => ({
    label: new Date(rs.calculatedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    value: RISK_ORD[rs.riskLevel] ?? 0,
  }))
  const latestRisk   = history.length > 0 ? history[history.length - 1].riskLevel : 'Low'
  const instrLevel   = INSTR_LEVEL(instruct?.headline)

  const INSTR_COLOR = { Critical: 'var(--red)', High: 'var(--rose)', Moderate: 'var(--amber)', Low: 'var(--green)' }
  const INSTR_BG    = { Critical: 'var(--red-subtle)', High: 'var(--rose-bg)', Moderate: 'var(--amber-bg)', Low: 'var(--green-bg)' }
  const INSTR_ICON  = { Critical: '🚨', High: '⚡', Moderate: '⚠', Low: '✅' }

  return (
    <div style={{ maxWidth: 640 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Faoliyatim</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Sog'liq tarixi va ko'rsatmalar</p>
      </div>

      {/* Status banner */}
      <div style={{ background: 'var(--gray-950)', borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <p style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Joriy holat</p>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '.875rem' }}>
            {history.length > 0 ? `${history.length} ta ko'rsatkich` : 'Hali ma\'lumot yo\'q'}
          </p>
        </div>
        <span className={`badge badge-${RISK_BADGE[latestRisk] ?? 'low'}`} style={{ fontSize: '.8125rem', padding: '5px 12px' }}>
          {latestRisk}
        </span>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 22 }}>
        {[
          { k: 'timeline', l: '📋 Tarix' },
          { k: 'trend',    l: '📈 Grafik' },
          { k: 'guide',    l: '💊 Ko\'rsatmalar' },
        ].map(tb => (
          <button key={tb.k} className={`tab${tab === tb.k ? ' active' : ''}`} onClick={() => setTab(tb.k)}>
            {tb.l}
          </button>
        ))}
      </div>

      {/* ── TIMELINE ── */}
      {tab === 'timeline' && (
        <div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💗</div>
              <p>Hali faoliyat yo'q. Birinchi nazoratni bajaring!</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Timeline rail */}
              <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 1.5, background: 'var(--border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {logs.map((log, i) => {
                  const cfg = ACT[log.type] ?? { icon: '•', label: log.type, color: 'var(--text-3)' }
                  return (
                    <div key={log.id} className="a-fadeUp" style={{ animationDelay: `${Math.min(i * .03, .3)}s`, position: 'relative', marginBottom: 8 }}>
                      {/* Dot */}
                      <div style={{ position: 'absolute', left: -26, top: 10, width: 10, height: 10, borderRadius: '50%', background: cfg.color, border: '2px solid var(--white)', boxShadow: `0 0 0 2px ${cfg.color}30` }} />

                      <div className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                            <span style={{ fontSize: '.85rem' }}>{cfg.icon}</span>
                            <span style={{ fontSize: '.72rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{cfg.label}</span>
                          </div>
                          <p style={{ fontSize: '.8125rem', color: 'var(--text)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {log.detail}
                          </p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p style={{ fontSize: '.7rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                            {new Date(log.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                          <p style={{ fontSize: '.68rem', color: 'var(--text-3)' }}>
                            {new Date(log.occurredAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={loadMore} disabled={moreLoading}>
                {moreLoading ? <span className="spin spin-dark" /> : '↓ Ko\'proq'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TREND ── */}
      {tab === 'trend' && (
        <div className="a-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📈</div>
              <p>Hali tarix yo'q</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: 16, fontSize: '.9rem' }}>Xavf darajasi tarixi</h3>
              <SketchLineChart data={chartData} width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 96 : 500, 520)} height={180} />
            </div>
          )}

          {history.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>Barcha yozuvlar</p>
              </div>
              <div>
                {[...history].reverse().map((rs, i) => (
                  <div key={i} className="a-fadeUp" style={{ animationDelay: `${i * .03}s`, padding: '9px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: i % 2 ? 'var(--bg-subtle)' : 'transparent' }}>
                    <span className={`badge badge-${RISK_BADGE[rs.riskLevel] ?? 'low'}`}>{rs.riskLevel}</span>
                    <span style={{ fontSize: '.74rem', color: 'var(--text-3)' }}>{new Date(rs.calculatedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INSTRUCTIONS ── */}
      {tab === 'guide' && (
        <div className="a-fadeIn">
          {!instruct ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>💊</div>
              <p>Ko'rsatmalar hali mavjud emas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Headline */}
              <div style={{ padding: '16px 18px', background: INSTR_BG[instrLevel], border: `1.5px solid ${INSTR_COLOR[instrLevel]}30`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{INSTR_ICON[instrLevel]}</span>
                <h3 style={{ fontSize: '.9375rem', color: INSTR_COLOR[instrLevel], margin: 0, lineHeight: 1.4 }}>{instruct.headline}</h3>
              </div>

              {/* Tips */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'var(--gray-950)' }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '.875rem', margin: 0 }}>💡 Nima qilish kerak</p>
                </div>
                {(instruct.tips ?? []).map((tip, i) => (
                  <div key={i} className="a-fadeUp" style={{ animationDelay: `${i * .05}s`, display: 'flex', gap: 12, padding: '12px 18px', borderBottom: i < instruct.tips.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 ? 'var(--bg-subtle)' : 'transparent' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: '.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <p style={{ fontSize: '.8375rem', color: 'var(--text)', margin: 0, lineHeight: 1.55 }}>{tip}</p>
                  </div>
                ))}
              </div>

              {instruct.basedOn && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.78rem', color: 'var(--text-3)', display: 'flex', gap: 7 }}>
                  <span>🔬</span>
                  <span><strong>Asosi:</strong> {instruct.basedOn}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
