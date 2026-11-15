import { useState } from 'react'
import { Link } from 'react-router'
import { SimplePage } from '../components/layouts.jsx'
import { Button, Field, Notice } from '../components/ui.jsx'
import { authRedirect, supabase } from '../lib/supabase.js'
import { errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import { checkEmail, cleanEmail } from '../lib/validate.js'

export function ForgotPassword() {
  useTitle('Forgot your password?')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [problem, setProblem] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const bad = checkEmail(email)
    setError(bad)
    setProblem('')
    if (bad) return document.getElementById('email')?.focus()

    setBusy(true)
    const address = cleanEmail(email)
    const { error: err } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: authRedirect('/reset-password'),
    })
    setBusy(false)
    if (err) setProblem(errorMessage(err))
    else setSentTo(address)
  }

  return (
    <SimplePage>
      <h1>Forgot your password?</h1>
      <p className="lede">Enter your email and we will send you a link to choose a new one.</p>

      {sentTo ? (
        <Notice kind="ok">
          If <strong className="break">{sentTo}</strong> has an account, a reset link is on its way.
        </Notice>
      ) : (
        <form onSubmit={submit} noValidate className="form">
          {problem && <Notice kind="error">{problem}</Notice>}
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" busy={busy}>
            Send reset link
          </Button>
        </form>
      )}

      <p>
        <Link to="/login">Back to sign in</Link>
      </p>
    </SimplePage>
  )
}
