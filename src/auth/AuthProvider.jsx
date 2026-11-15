import { useCallback, useEffect, useMemo, useState } from 'react'
import { forgetPages } from '../lib/data.js'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './context.js'

// The last profile seen on this device, so the app opens without waiting for
// the database. It only picks which screen to show; RLS still guards the data,
// and the fresh profile replaces it a moment later.
const PROFILE_KEY = 'cbe.profile'
function readSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) ?? null
  } catch {
    return null
  }
}
function saveProfile(p) {
  try {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    // Storage blocked: the app still works, just a little slower to open.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = not known yet
  const [profile, setProfile] = useState(readSavedProfile)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Fires once at start (INITIAL_SESSION), then on every sign-in / sign-out.
    // Do not call supabase inside this callback: it can deadlock the client.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  // Signed out (here, in another tab, or the session ran out): forget this person.
  useEffect(() => {
    if (session !== null) return
    saveProfile(null)
    forgetPages()
  }, [session])

  useEffect(() => {
    if (!userId) return
    let stale = false
    const load = (cols) => supabase.from('profiles').select(cols).eq('id', userId).single()
    // photo_path arrives with migration 005 and avatar with 006; until they are
    // run, load without them.
    const base = 'id, role, full_name, email, gender'
    load(`${base}, photo_path, avatar`)
      .then((r) => (r.error?.code === '42703' ? load(`${base}, photo_path`) : r))
      .then((r) => (r.error?.code === '42703' ? load(base) : r))
      .then(({ data, error }) => {
        if (stale) return
        setFailed(Boolean(error))
        setProfile(error ? null : data)
        saveProfile(error ? null : data)
      })
    return () => {
      stale = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => {
    setFailed(false)
    setProfile(null)
    setAttempt((n) => n + 1)
  }, [])

  // After the student saves their profile, keep the header name in step.
  const updateProfile = useCallback((patch) => {
    setProfile((p) => {
      const next = p ? { ...p, ...patch } : p
      saveProfile(next)
      return next
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    saveProfile(null)
    forgetPages()
    setFailed(false)
  }, [])

  let status
  if (session === undefined) status = 'loading'
  else if (!session) status = 'signed-out'
  else if (failed) status = 'error'
  else if (profile?.id === userId) status = 'ready'
  else status = 'loading'

  const value = useMemo(
    () => ({ status, session, profile: status === 'ready' ? profile : null, reload, updateProfile, signOut }),
    [status, session, profile, reload, updateProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
