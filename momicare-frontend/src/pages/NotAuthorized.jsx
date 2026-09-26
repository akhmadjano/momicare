import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/LangContext'

export default function NotAuthorized() {
  const nav   = useNavigate()
  const { t } = useLang()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', padding: 24 }}>
      <div className="card card-p a-scaleIn" style={{ maxWidth: 380, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--red-subtle)', border: '1px solid var(--red-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 20px' }}>
          🔒
        </div>
        <h2 style={{ marginBottom: 9, fontSize: '1.2rem' }}>{t('notAuth.title')}</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem', marginBottom: 24, lineHeight: 1.6 }}>{t('notAuth.msg')}</p>
        <button className="btn btn-secondary" onClick={() => nav(-1)}>{t('notAuth.goBack')}</button>
      </div>
    </div>
  )
}
