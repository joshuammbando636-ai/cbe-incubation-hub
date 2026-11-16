import { useState } from 'react'
import { Link } from 'react-router'
import { AuthShell } from '../components/layouts.jsx'
import { Button, Field, Notice } from '../components/ui.jsx'
import { authRedirect, supabase } from '../lib/supabase.js'
import { MSG, errorMessage, required } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import { checkEmail, cleanEmail, firstError } from '../lib/validate.js'

export function Login() {
  useTitle('Sign in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('') // '', 'unconfirmed', or a message
  const [busy, setBusy] = useState(false)
  const [resend, setResend] = useState('idle') // idle | busy | sent | message

  async function submit(e) {
    e.preventDefault()
    const next = { email: checkEmail(email), password: password ? '' : required('password') }
    setErrors(next)
    setProblem('')
    setResend('idle')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail(email), password })
    setBusy(false)
    // On success the router moves on by itself (see SignedOutOnly).
    if (!error) return
    if (error.code === 'invalid_credentials') setProblem('Wrong email or password.')
    else if (error.code === 'email_not_confirmed') setProblem('unconfirmed')
    else setProblem(errorMessage(error))
  }

  async function sendAgain() {
    setResend('busy')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail(email),
      options: { emailRedirectTo: authRedirect('/auth/callback') },
    })
    setResend(error ? errorMessage(error) : 'sent')
  }

  return (
    <AuthShell
      title="Welcome back"
      sub="Sign in to see your idea, your mentor and what to do next."
      line="Turn your idea into a business."
    >
          {problem === 'unconfirmed' ? (
            <Notice kind="wait">
              <p>Confirm your email first. We sent you a link when you signed up.</p>
              {resend === 'sent' ? (
                <p>{MSG.sent}</p>
              ) : (
                <>
                  {resend !== 'idle' && resend !== 'busy' && <p className="error-text">{resend}</p>}
                  <Button type="button" variant="secondary" busy={resend === 'busy'} onClick={sendAgain}>
                    Send the link again
                  </Button>
                </>
              )}
            </Notice>
          ) : (
            problem && <Notice kind="error">{problem}</Notice>
          )}

          <form onSubmit={submit} noValidate className="form">
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Button type="submit" busy={busy}>
              Sign in
            </Button>
          </form>

          <p className="auth-links">
            <Link to="/signup">New here? Create an account</Link>
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
    </AuthShell>
  )
}
