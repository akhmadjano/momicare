import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'momicare_auth'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => loadStored())

  const login = useCallback((data) => {
    // data: { token, role, userId, patientId }
    const stored = {
      token:     data.token,
      role:      data.role,
      userId:    data.userId,
      patientId: data.patientId ?? null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    setAuthState(stored)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
