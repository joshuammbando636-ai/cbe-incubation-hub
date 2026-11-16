import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context.js'
import { SimplePage } from '../components/layouts.jsx'
import { Button, Field, Notice, Spinner } from '../components/ui.jsx'
import { landingError, supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import { checkNewPassword, checkSamePassword, firstError } from '../lib/validate.js'

// The reset link signs the person in, then lands here to set a new password.
export function ResetPassword() {
  useTitle('Choose a new password')
  const { status } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (status === 'loading' && !landingError()) return <Spinner />

  const expired = landingError() || status === 'signed-out'

  async function submit(e) {
    e.preventDefault()
    const next = { password: checkNewPassword(password), confirm: checkSamePassword(password, confirm) }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (!error) return setDone(true)
    if (error.code === 'weak_password') setErrors({ password: MSG.shortPassword })
    else setProblem(errorMessage(error))
  }

  return (
    <SimplePage>
      <h1>Choose a new password</h1>

      {expired ? (
        <Notice kind="error">
          <p>This reset link has expired. Ask for a new one.</p>
          <p>
            <Link to="/forgot-password" className="link-btn">
              Send a new link
            </Link>
          </p>
        </Notice>
      ) : done ? (
        <>
          <Notice kind="ok">Password changed.</Notice>
          <p>
            <Link to="/" className="link-btn">
              Go to the start page
            </Link>
          </p>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="form">
          {problem && <Notice kind="error">{problem}</Notice>}
          <Field
            id="password"
            label="New password"
            hint="At least 8 characters."
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Field
            id="confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <Button type="submit" busy={busy} busyLabel={MSG.saving}>
            Save new password
          </Button>
        </form>
      )}
    </SimplePage>
  )
}
