import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/context.js'
import { SimplePage } from '../components/layouts.jsx'
import { Button, Field, Notice } from '../components/ui.jsx'
import { authRedirect, landingError, supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import { checkEmail, cleanEmail } from '../lib/validate.js'

// The confirm link lands here. Supabase signs the person in from the URL while
// starting up; if that worked we go to the start page.
export function AuthCallback() {
  const { status } = useAuth()
  const linkFailed = Boolean(landingError())

  if (!linkFailed && status === 'loading') {
    return (
      <SimplePage>
        <p className="lede" role="status">
          Confirming your email…
        </p>
      </SimplePage>
    )
  }
  if (!linkFailed && status !== 'signed-out') return <Navigate to="/" replace />
  return <LinkFailed />
}

function LinkFailed() {
  useTitle('That link did not work')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [resend, setResend] = useState('idle') // idle | busy | sent | message

  async function submit(e) {
    e.preventDefault()
    const problem = checkEmail(email)
    setError(problem)
    if (problem) return document.getElementById('email')?.focus()
    setResend('busy')
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail(email),
      options: { emailRedirectTo: authRedirect('/auth/callback') },
    })
    setResend(err ? errorMessage(err) : 'sent')
  }

  return (
    <SimplePage>
      <h1>That link did not work</h1>
      <p className="lede">It may have expired or been used already. Ask for a new one below.</p>

      {resend === 'sent' ? (
        <Notice kind="ok">{MSG.sent}</Notice>
      ) : (
        <form onSubmit={submit} noValidate className="form">
          {resend !== 'idle' && resend !== 'busy' && <Notice kind="error">{resend}</Notice>}
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
          <Button type="submit" busy={resend === 'busy'}>
            Send a new link
          </Button>
        </form>
      )}

      <p>
        <Link to="/login">Back to sign in</Link>
      </p>
    </SimplePage>
  )
}
