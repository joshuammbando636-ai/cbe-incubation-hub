import { lazy, Suspense } from 'react'
import { Navigate, Outlet } from 'react-router'
import { Spinner } from '../components/ui.jsx'
import { AccountError } from '../pages/AccountError.jsx'
import { isStaffRole, useAuth } from './context.js'

// These only decide which screen to show. The database (RLS) decides what
// data each person gets, so a wrong screen never leaks anything.

// The landing page (and its animation library) loads only for visitors who are signed out.
const Landing = lazy(() => import('../pages/Landing.jsx').then((m) => ({ default: m.Landing })))

export function Home() {
  const { status, profile } = useAuth()
  // While we check who this is, draw the landing page under its intro sheet
  // instead of a spinner. Same element as the signed-out branch, so it stays
  // mounted; a signed-in person is sent on below before the sheet lifts.
  if (status === 'loading')
    return (
      <Suspense fallback={<Spinner />}>
        <Landing authPending />
      </Suspense>
    )
  if (status === 'signed-out')
    return (
      <Suspense fallback={<Spinner />}>
        <Landing />
      </Suspense>
    )
  if (status === 'error') return <AccountError />
  return <Navigate to={isStaffRole(profile.role) ? '/staff' : '/student'} replace />
}

export function SignedOutOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <Spinner />
  if (status !== 'signed-out') return <Navigate to="/" replace />
  return <Outlet />
}

export function RequireRole({ roles }) {
  const { status, profile } = useAuth()
  if (status === 'loading') return <Spinner />
  if (status === 'signed-out') return <Navigate to="/login" replace />
  if (status === 'error') return <AccountError />
  if (!roles.includes(profile.role)) return <Navigate to="/" replace />
  return <Outlet />
}
