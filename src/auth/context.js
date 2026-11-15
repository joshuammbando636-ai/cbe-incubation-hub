import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// status: 'loading' | 'signed-out' | 'ready' | 'error'
// profile: { id, role, full_name, email } when status is 'ready'
export function useAuth() {
  return useContext(AuthContext)
}

export const isStaffRole = (role) => role === 'mentor' || role === 'admin'
