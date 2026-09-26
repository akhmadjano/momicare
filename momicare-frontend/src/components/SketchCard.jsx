import React from 'react'

const V = {
  default:  { bg:'#fff',                                           border:'var(--border)',    sh:'var(--s-sm)' },
  accent:   { bg:'linear-gradient(145deg,#fff,var(--cr-50))',      border:'var(--cr-200)',    sh:'var(--s-md)' },
  purple:   { bg:'linear-gradient(145deg,#fff,var(--pu-50))',      border:'var(--pu-200)',    sh:'var(--s-md)' },
  critical: { bg:'linear-gradient(145deg,#fff8f9,var(--cr-100))',  border:'var(--cr-300)',    sh:'var(--s-md)' },
  high:     { bg:'linear-gradient(145deg,#fff9f9,var(--err-bg))',  border:'var(--err)',       sh:'var(--s-sm)' },
  moderate: { bg:'linear-gradient(145deg,#fffef5,var(--warn-bg))', border:'var(--warn)',      sh:'var(--s-sm)' },
  low:      { bg:'linear-gradient(145deg,#f7fff9,var(--ok-bg))',   border:'var(--ok)',        sh:'var(--s-sm)' },
  flat:     { bg:'var(--cr-50)',                                   border:'var(--cr-100)',    sh:'none'        },
}

export default function Card({ children, style={}, padding='20px 22px', variant='default', animate=false, lift=false }) {
  const v=V[variant]??V.default
  return (
    <div className={[animate?'anim-fadeUp':'', lift?'card-lift':''].filter(Boolean).join(' ')}
      style={{ background:v.bg, border:`1px solid ${v.border}`, borderRadius:'var(--r-lg)',
               boxShadow:v.sh, overflow:'hidden', ...style }}>
      <div style={{padding}}>{children}</div>
    </div>
  )
}
