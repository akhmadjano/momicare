import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LangContext'
import LanguageSwitcher from './LanguageSwitcher'

const LINKS = (t) => ({
  patient: [
    { to:'/checkin',     label:t('nav.checkin')    },
    { to:'/my-activity', label:t('nav.myActivity') },
  ],
  nurse:   [{ to:'/nurse', label:t('nav.dataEntry') }],
  doctor:  [{ to:'/dashboard', label:t('nav.dashboard') }],
  admin:   [
    { to:'/dashboard',        label:t('nav.dashboard')   },
    { to:'/regional',         label:t('nav.regional')    },
    { to:'/admin/assignments',label:t('nav.assignments') },
  ],
})

export default function NavBar() {
  const {auth,logout}=useAuth()
  const navigate=useNavigate()
  const location=useLocation()
  const {t}=useLang()
  const [scrolled,setScrolled]=useState(false)

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>4)
    window.addEventListener('scroll',h)
    return()=>window.removeEventListener('scroll',h)
  },[])

  const links=LINKS(t)[auth?.role]??[]

  return (
    <nav style={{
      background:'var(--g-nav)',
      position:'sticky',top:0,zIndex:200,
      boxShadow:scrolled?'0 2px 20px rgba(26,0,8,.35)':'none',
      borderBottom:'1px solid rgba(255,255,255,.06)',
      transition:'box-shadow .22s',
    }}>
      <div style={{maxWidth:960,margin:'0 auto',padding:'0 20px',height:56,display:'flex',alignItems:'center',gap:4}}>

        {/* Brand */}
        <Link to="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',marginRight:12,flexShrink:0}}>
          <span style={{fontSize:'1.35rem',animation:'float 3s ease-in-out infinite',display:'inline-block'}}>🤰</span>
          <span style={{fontSize:'1.05rem',fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>
            Momi<span style={{color:'var(--cr-300)'}}>Care</span>
          </span>
        </Link>

        <div style={{width:1,height:18,background:'rgba(255,255,255,.14)',marginRight:6,flexShrink:0}}/>

        {/* Links */}
        <div style={{display:'flex',gap:1,flex:1}}>
          {links.map(l=>{
            const active=location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to} style={{
                padding:'5px 12px',
                borderRadius:'var(--r-sm)',
                color:active?'#fff':'rgba(255,255,255,.58)',
                background:active?'rgba(255,255,255,.13)':'transparent',
                fontWeight:active?650:450,
                fontSize:'.84rem',letterSpacing:'.01em',
                textDecoration:'none',
                borderBottom:active?'2px solid var(--cr-300)':'2px solid transparent',
                transition:'all .15s',whiteSpace:'nowrap',
              }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background='rgba(255,255,255,.08)'}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* Right */}
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <LanguageSwitcher dark/>
          {auth?.role&&(
            <span style={{
              padding:'3px 10px',borderRadius:'var(--r-full)',
              background:'rgba(255,255,255,.10)',color:'rgba(255,255,255,.75)',
              border:'1px solid rgba(255,255,255,.15)',
              fontSize:'.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',
            }}>
              {t(`common.${auth.role}`)||auth.role}
            </span>
          )}
          <div style={{width:1,height:16,background:'rgba(255,255,255,.14)'}}/>
          <button onClick={()=>{logout();navigate('/login')}} style={{
            padding:'5px 13px',
            background:'transparent',
            border:'1px solid rgba(255,255,255,.20)',
            borderRadius:'var(--r-sm)',
            color:'rgba(255,255,255,.72)',
            fontSize:'.8rem',fontWeight:600,
            cursor:'pointer',fontFamily:'inherit',
            transition:'all .14s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.12)';e.currentTarget.style.color='#fff'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,.72)'}}>
            {t('common.signOut')}
          </button>
        </div>
      </div>
    </nav>
  )
}
