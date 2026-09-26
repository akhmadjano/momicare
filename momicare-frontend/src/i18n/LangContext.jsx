import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations } from './translations'

const LangContext = createContext(null)

const STORAGE_KEY = 'momicare_lang'
const SUPPORTED   = ['en', 'uz', 'ru']

function loadLang() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return SUPPORTED.includes(saved) ? saved : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)

  const setLang = useCallback((l) => {
    if (!SUPPORTED.includes(l)) return
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }, [])

  /**
   * t('common.loading') → looks up translations.common.loading[lang]
   * Falls back to EN, then to the key itself.
   */
  const t = useCallback((path) => {
    const parts = path.split('.')
    let node = translations
    for (const p of parts) {
      if (node == null) break
      node = node[p]
    }
    if (node && typeof node === 'object') {
      return node[lang] ?? node['en'] ?? path
    }
    return path
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t, supportedLangs: SUPPORTED }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
