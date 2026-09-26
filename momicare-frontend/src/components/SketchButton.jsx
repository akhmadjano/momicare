import React, { useState } from 'react'

const V = {
  primary:   { bg:'var(--g-primary)', bgh:'linear-gradient(135deg,var(--cr-500) 0%,var(--cr-700) 100%)', c:'#fff', border:'transparent', sh:'0 2px 8px rgba(176,0,26,.30)', shh:'0 4px 16px rgba(176,0,26,.40)' },
  accent:    { bg:'var(--g-accent)',  bgh:'linear-gradient(135deg,var(--pu-500) 0%,var(--pu-700) 100%)', c:'#fff', border:'transparent', sh:'0 2px 8px rgba(107,33,168,.28)', shh:'0 4px 14px rgba(107,33,168,.38)' },
  secondary: { bg:'var(--cr-50)',     bgh:'var(--cr-100)',   c:'var(--cr-700)', border:'var(--cr-200)', sh:'none', shh:'0 2px 8px rgba(176,0,26,.12)' },
  ghost:     { bg:'transparent',      bgh:'var(--cr-50)',    c:'var(--cr-600)', border:'var(--cr-300)', sh:'none', shh:'none' },
  danger:    { bg:'linear-gradient(135deg,var(--err) 0%,#8b1212 100%)', bgh:'linear-gradient(135deg,#c52020 0%,#9a1414 100%)', c:'#fff', border:'transparent', sh:'0 2px 8px rgba(185,28,28,.28)', shh:'0 4px 14px rgba(185,28,28,.38)' },
  success:   { bg:'linear-gradient(135deg,var(--ok) 0%,#0f5f2e 100%)',  bgh:'linear-gradient(135deg,#18994a 0%,#116b34 100%)', c:'#fff', border:'transparent', sh:'0 2px 8px rgba(21,128,61,.24)',  shh:'0 4px 14px rgba(21,128,61,.34)' },
  outline:   { bg:'transparent',      bgh:'var(--cr-600)',   c:'var(--cr-600)', ch:'#fff', border:'var(--cr-600)', sh:'none', shh:'0 2px 8px rgba(176,0,26,.20)' },
}

export default function Btn({ children, onClick, disabled=false, variant='primary', style={}, type='button', fullWidth=false }) {
  const [h,setH]=useState(false)
  const [p,setP]=useState(false)
  const v=V[variant]??V.primary
  const col=(h&&v.ch)?v.ch:v.c
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setP(false)}}
      onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,
        padding:'9px 20px',
        background:h&&!disabled?v.bgh:v.bg,
        color:col,
        border:`1.5px solid ${v.border==='transparent'?'transparent':v.border}`,
        borderRadius:'var(--r-md)',
        fontSize:'.875rem',fontWeight:650,fontFamily:'inherit',letterSpacing:'.01em',
        cursor:disabled?'not-allowed':'pointer',
        opacity:disabled?.48:1,
        transition:'all .16s cubic-bezier(.22,1,.36,1)',
        boxShadow:h&&!disabled?v.shh:v.sh,
        transform:p&&!disabled?'scale(.975) translateY(1px)':'none',
        width:fullWidth?'100%':'auto',
        outline:'none',
        whiteSpace:'nowrap',
        ...style,
      }}>
      {children}
    </button>
  )
}
