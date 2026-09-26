import React from 'react'
import { useLang } from '../i18n/LangContext'

export default function TrendArrow({ trend='stable' }) {
  const {t}=useLang()
  const C={
    increasing:{sym:'↑',color:'var(--err)',  bg:'var(--err-bg)',  key:'risk.increasing'},
    stable:    {sym:'→',color:'var(--warn)', bg:'var(--warn-bg)', key:'risk.stable'},
    decreasing:{sym:'↓',color:'var(--ok)',   bg:'var(--ok-bg)',   key:'risk.decreasing'},
  }
  const c=C[trend]??C.stable
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',
      background:c.bg,color:c.color,borderRadius:'var(--r-full)',fontSize:'.74rem',fontWeight:700}}>
      {c.sym} {t(c.key)}
    </span>
  )
}
