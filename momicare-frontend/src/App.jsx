import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './i18n/LangContext'
import AppShell from './components/AppShell'

import LandingPage     from './pages/LandingPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import CheckinPage     from './pages/CheckinPage'
import MyActivityPage  from './pages/MyActivityPage'
import NursePage       from './pages/NursePage'
import DashboardPage   from './pages/DashboardPage'
import PatientDetail   from './pages/PatientDetail'
import RegionalPage    from './pages/RegionalPage'
import AssignmentsPage from './pages/AssignmentsPage'
import NotAuthorized   from './pages/NotAuthorized'

/* ── Guards ────────────────────────────────────────── */
function Auth({ children, roles }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  if (roles && !roles.includes(auth.role)) return <Navigate to="/not-authorized" replace />
  return children
}

function Wrap({ children }) {
  return <AppShell>{children}</AppShell>
}

function Home() {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/" replace />
  switch (auth.role) {
    case 'patient': return <Navigate to="/checkin"   replace />
    case 'nurse':   return <Navigate to="/nurse"     replace />
    default:        return <Navigate to="/dashboard" replace />
  }
}

/* ── Router ────────────────────────────────────────── */
function Routes_() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"             element={<LandingPage />}   />
      <Route path="/login"        element={<LoginPage />}     />
      <Route path="/register"     element={<RegisterPage />}  />
      <Route path="/not-authorized" element={<NotAuthorized />} />

      {/* Patient */}
      <Route path="/checkin"     element={<Auth roles={['patient']}><Wrap><CheckinPage /></Wrap></Auth>} />
      <Route path="/my-activity" element={<Auth roles={['patient']}><Wrap><MyActivityPage /></Wrap></Auth>} />

      {/* Nurse */}
      <Route path="/nurse" element={<Auth roles={['nurse']}><Wrap><NursePage /></Wrap></Auth>} />

      {/* Doctor + Admin */}
      <Route path="/dashboard"    element={<Auth roles={['doctor','admin']}><Wrap><DashboardPage /></Wrap></Auth>} />
      <Route path="/dashboard/:id" element={<Auth roles={['doctor','admin']}><Wrap><PatientDetail /></Wrap></Auth>} />

      {/* Admin */}
      <Route path="/regional"          element={<Auth roles={['admin']}><Wrap><RegionalPage /></Wrap></Auth>} />
      <Route path="/admin/assignments" element={<Auth roles={['admin']}><Wrap><AssignmentsPage /></Wrap></Auth>} />

      {/* Redirects */}
      <Route path="/home" element={<Home />} />
      <Route path="*"     element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes_ />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
