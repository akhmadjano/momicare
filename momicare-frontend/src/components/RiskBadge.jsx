import React from 'react'
import { useLang } from '../i18n/LangContext'

const C = {
  Low:      { bg:'var(--ok-bg)',   color:'var(--ok)',   border:'rgba(21,128,61,.25)',  icon:'✓'  },
  Moderate: { bg:'var(--warn-bg)', color:'var(--warn)', border:'rgba(180,83,9,.25)',   icon:'⚠'  },
  High:     { bg:'var(--err-bg)',  color:'var(--err)',  border:'rgba(185,28,28,.25)',  icon:'⚡' },
  Critical: { bg:'var(--cr-600)',  color:'#fff',        border:'transparent',           icon:'🚨' },
}
const S = {
  sm: { px:'3px 9px',  fs:'.7rem',  gap:4 },
  md: { px:'5px 12px', fs:'.8rem',  gap:5 },
  lg: { px:'8px 16px', fs:'.88rem', gap:6 },
}

export default function RiskBadge({ level='Low', mismatch=false, size='md', style={} }) {
  const {t}=useLang()
  const c=C[level]??C.Low
  const s=S[size]??S.md
  return (
    <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:3,...style}}>
      <span style={{
        display:'inline-flex',alignItems:'center',gap:s.gap,
        padding:s.px,
        background:c.bg,color:c.color,
        border:`1.5px solid ${c.border}`,
        borderRadius:'var(--r-full)',
        fontSize:s.fs,fontWeight:700,letterSpacing:'.02em',whiteSpace:'nowrap',
      }}>
        <span>{c.icon}</span>{t(`risk.${level}`)}
      </span>
      {mismatch&&(
        <span style={{fontSize:'.65rem',fontWeight:700,color:'var(--pu-600)',background:'var(--pu-100)',padding:'1px 7px',borderRadius:99,border:'1px solid var(--pu-200)'}}>
          ⚑ AI
        </span>
      )}
    </div>
  )
}
