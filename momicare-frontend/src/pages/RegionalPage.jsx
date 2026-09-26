import React, { useState, useEffect } from 'react'
import { getRegionalSummary } from '../api/regional'
import { useLang } from '../i18n/LangContext'

const RCL = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }
const RO  = { Critical: 0, High: 1, Moderate: 2, Low: 3 }
const BAR = { Critical: 'var(--red)', High: 'var(--rose)', Moderate: 'var(--amber)', Low: 'var(--green)' }

export default function RegionalPage() {
  const { t }     = useLang()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy,  setSortBy]  = useState('risk')

  useEffect(() => {
    getRegionalSummary().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const total    = data.reduce((s, d) => s + d.patientCount, 0)
  const maxCount = Math.max(...data.map(d => d.patientCount), 1)
  const needAtt  = data.filter(d => d.dominantRiskLevel === 'Critical' || d.dominantRiskLevel === 'High').length
  const sorted   = [...data].sort((a, b) =>
    sortBy === 'risk'  ? (RO[a.dominantRiskLevel] ?? 4) - (RO[b.dominantRiskLevel] ?? 4) :
    sortBy === 'count' ? b.patientCount - a.patientCount :
    a.district.localeCompare(b.district)
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}><span className="spin spin-dark" style={{ width: 28, height: 28 }} /></div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Mintaqaviy xulosa</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Anonimizatsiyalangan tuman ma'lumotlari</p>
      </div>

      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { l: 'Jami bemorlar',       v: total,       bg: 'var(--gray-950)', tc: '#fff', bc: 'transparent' },
          { l: 'Tumanlar',            v: data.length, bg: 'var(--white)',    tc: 'var(--text)',  bc: 'var(--border)' },
          { l: 'Diqqat talab qiladi', v: needAtt,     bg: 'var(--red-subtle)', tc: 'var(--red)', bc: 'var(--red-muted)' },
        ].map((s, i) => (
          <div key={i} className="a-fadeUp" style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.bc}`, boxShadow: 'var(--shadow-2)', animationDelay: `${i * .06}s` }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.tc, lineHeight: 1.1, marginBottom: 4 }}>{s.v}</div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: s.bg === 'var(--gray-950)' ? 'var(--gray-400)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div style={{ padding: '9px 13px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.8rem', color: 'var(--text-2)', marginBottom: 18, display: 'flex', gap: 7 }}>
        🔐 Bemor ismlari yoki ID'lar ko'rsatilmaydi — barcha ma'lumotlar anonimdir
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ k: 'risk', l: 'Xavf' }, { k: 'count', l: 'Son' }, { k: 'alpha', l: 'A–Z' }].map(s => (
          <button key={s.k} onClick={() => setSortBy(s.k)} className={`btn btn-sm ${sortBy === s.k ? 'btn-primary' : 'btn-secondary'}`}>{s.l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card a-fadeUp" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Tuman</th><th>Xavf darajasi</th><th>Bemorlar</th><th style={{ width: '35%' }}>Ulushi</th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>Ma'lumot yo'q</td></tr>}
            {sorted.map((d, i) => {
              const pct      = total > 0 ? Math.round((d.patientCount / total) * 100) : 0
              const barColor = BAR[d.dominantRiskLevel] ?? 'var(--gray-300)'
              return (
                <tr key={d.district} className="a-fadeUp" style={{ animationDelay: `${Math.min(i * .03, .3)}s` }}>
                  <td style={{ fontWeight: 600, fontSize: '.875rem' }}>{d.district}</td>
                  <td>
                    <span className={`badge badge-${RCL[d.dominantRiskLevel ?? 'Low']}`}>
                      {d.dominantRiskLevel ?? 'Low'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{d.patientCount}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-3)', marginLeft: 5 }}>{pct}%</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${(d.patientCount / maxCount) * 100}%`, background: barColor, transition: 'width .5s var(--ease-out)' }} />
                      </div>
                      <span style={{ fontSize: '.7rem', color: 'var(--text-3)', minWidth: 24, textAlign: 'right' }}>{d.patientCount}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
