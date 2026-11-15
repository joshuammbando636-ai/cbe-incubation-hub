import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { checkNewPassword, checkSamePassword, firstError } from '../lib/validate.js'
import { Button, Field, Notice } from './ui.jsx'

// Change password while signed in. Used on every Profile page.
export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null) // { kind, text }
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const next = { new_password: checkNewPassword(password), confirm_password: checkSamePassword(password, confirm) }
    setErrors(next)
    setResult(null)
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (!error) {
      setPassword('')
      setConfirm('')
      return setResult({ kind: 'ok', text: 'Password changed.' })
    }
    if (error.code === 'weak_password') setErrors({ new_password: MSG.shortPassword })
    else if (error.code === 'same_password') setErrors({ new_password: 'This is already your password.' })
    else setResult({ kind: 'error', text: errorMessage(error) })
  }

  return (
    <form onSubmit={submit} noValidate className="form">
      <section className="form-section">
        <h2>Password</h2>
        <Field
          id="new_password"
          label="New password"
          hint="At least 8 characters."
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => (setResult(null), setPassword(e.target.value))}
          error={errors.new_password}
        />
        <Field
          id="confirm_password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => (setResult(null), setConfirm(e.target.value))}
          error={errors.confirm_password}
        />
      </section>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
      <div className="actions">
        <Button type="submit" busy={busy} busyLabel={MSG.saving}>
          Change password
        </Button>
      </div>
    </form>
  )
}
