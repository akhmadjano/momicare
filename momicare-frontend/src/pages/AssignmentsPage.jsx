import React, { useState, useEffect } from 'react'
import { getPatients } from '../api/patients'
import { assignPatient } from '../api/doctors'
import api from '../api/client'
import { useLang } from '../i18n/LangContext'

const RCL = { Critical: 'critical', High: 'high', Moderate: 'moderate', Low: 'low' }

export default function AssignmentsPage() {
  const { t }       = useLang()
  const [patients,  setPatients]  = useState([])
  const [doctors,   setDoctors]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busy,      setBusy]      = useState(null)
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState({})
  const [toast,     setToast]     = useState(null)

  useEffect(() => {
    getPatients().then(r => {
      setPatients(r.data)
      if (r.data.length > 0) {
        api.get(`/patients/${r.data[0].id}`).then(d => setDoctors(d.data.assignedDoctors ?? [])).catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function showToast(msg, ok) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  async function assign(patientId) {
    const doctorId = selected[patientId]; if (!doctorId) return
    setBusy(patientId)
    try {
      await assignPatient(doctorId, patientId)
      showToast('✓ Muvaffaqiyatli biriktirildi', true)
      const r = await getPatients(); setPatients(r.data)
    } catch(e) {
      showToast(`Xatolik: ${e.response?.data?.error ?? e.message}`, false)
    } finally { setBusy(null) }
  }

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.district?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}><span className="spin spin-dark" style={{ width: 28, height: 28 }} /></div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Tayinlashlar</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem' }}>Shifokorlarni bemorlarga biriktiring</p>
      </div>

      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { l: 'Jami bemorlar', v: patients.length,  bg: 'var(--gray-950)', tc: '#fff', bc: 'transparent' },
          { l: 'Shifokorlar',   v: doctors.length,   bg: 'var(--white)', tc: 'var(--text)', bc: 'var(--border)' },
          { l: 'Tayinlanmagan', v: patients.filter(p => !(p.assignedDoctors ?? []).length).length, bg: 'var(--amber-bg)', tc: 'var(--amber)', bc: '#fde68a' },
        ].map((s, i) => (
          <div key={i} className="a-fadeUp" style={{ padding: '16px 18px', borderRadius: 12, background: s.bg, border: `1px solid ${s.bc}`, boxShadow: 'var(--shadow-1)', animationDelay: `${i * .06}s` }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.tc, lineHeight: 1.1, marginBottom: 4 }}>{s.v}</div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: s.bg === 'var(--gray-950)' ? 'var(--gray-400)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="a-fadeDown" style={{ marginBottom: 14, padding: '10px 14px', background: toast.ok ? 'var(--green-bg)' : 'var(--rose-bg)', border: `1px solid ${toast.ok ? '#bbf7d0' : '#fecdd3'}`, borderRadius: 8, color: toast.ok ? 'var(--green)' : 'var(--rose)', fontWeight: 600, fontSize: '.8375rem' }}>
          {toast.msg}
        </div>
      )}

      {/* Table */}
      <div className="card a-fadeUp" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '.85rem', pointerEvents: 'none' }}>🔍</span>
            <input className="input input-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki tuman…" style={{ paddingLeft: 30 }} />
          </div>
          <span style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>{filtered.length} / {patients.length}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Tuman</th>
                <th>Hafta</th>
                <th>Xavf</th>
                <th>Hozirgi shifokor</th>
                <th style={{ width: 260 }}>Biriktirish</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>Topilmadi</td></tr>}
              {filtered.map((p, i) => (
                <tr key={p.id} className="a-fadeUp" style={{ animationDelay: `${Math.min(i * .03, .3)}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.78rem', flexShrink: 0, color: 'var(--text-2)' }}>
                        {p.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '.8375rem', color: 'var(--text)', marginBottom: 1 }}>{p.name}</p>
                        <p style={{ fontSize: '.72rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>{p.phoneNumber ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '.8125rem', color: 'var(--text-2)' }}>{p.district ?? '—'}</td>
                  <td>{p.pregnancyWeek != null ? <span className="badge badge-neutral">{p.pregnancyWeek}w</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td>{p.currentRiskLevel ? <span className={`badge badge-${RCL[p.currentRiskLevel]}`}>{p.currentRiskLevel}</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td>
                    {(p.assignedDoctors ?? []).length > 0
                      ? p.assignedDoctors.map(d => <span key={d.id} style={{ display: 'inline-block', fontSize: '.78rem', fontWeight: 500, color: 'var(--text-2)', marginRight: 4 }}>👨‍⚕️ {d.name}</span>)
                      : <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>Tayinlanmagan</span>
                    }
                  </td>
                  <td>
                    {doctors.length > 0 ? (
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <select className="input input-sm" value={selected[p.id] ?? ''} onChange={e => setSelected(s => ({ ...s, [p.id]: e.target.value ? Number(e.target.value) : '' }))} style={{ flex: 1, cursor: 'pointer' }}>
                          <option value="">— Shifokor —</option>
                          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={!selected[p.id] || busy === p.id} onClick={() => assign(p.id)} style={{ flexShrink: 0 }}>
                          {busy === p.id ? <span className="spin" style={{ width: 12, height: 12 }} /> : 'Biriktir'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>Shifokorlar yo'q</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
