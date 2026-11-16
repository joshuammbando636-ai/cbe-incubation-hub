import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/context.js'
import { SimplePage } from '../components/layouts.jsx'
import { Button, Notice } from '../components/ui.jsx'
import { authRedirect, supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'

export function CheckEmail() {
  useTitle('Check your email')
  const email = useLocation().state?.email
  const [resend, setResend] = useState('idle') // idle | busy | sent | message
  const { status } = useAuth()

  // The email link opens in a new tab and signs the person in there. Supabase
  // tells this tab too, so move on instead of still saying "check your email".
  if (status === 'ready') return <Navigate to="/" replace />
  if (!email) return <Navigate to="/login" replace />

  async function sendAgain() {
    setResend('busy')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authRedirect('/auth/callback') },
    })
    setResend(error ? errorMessage(error) : 'sent')
  }

  return (
    <SimplePage>
      <h1>Check your email</h1>
      <p className="lede">
        We sent a link to <strong className="break">{email}</strong>. Open it to confirm your address. The link signs
        you in.
      </p>
      <p className="small">Nothing after a few minutes? Look in your spam folder, or send it again.</p>

      {resend === 'sent' ? (
        <Notice kind="ok">{MSG.sent}</Notice>
      ) : (
        <>
          {resend !== 'idle' && resend !== 'busy' && <Notice kind="error">{resend}</Notice>}
          <Button type="button" variant="secondary" busy={resend === 'busy'} onClick={sendAgain}>
            Send the link again
          </Button>
        </>
      )}

      <p>
        <Link to="/login" className="link-btn link-btn--back">
          Back to sign in
        </Link>
      </p>
    </SimplePage>
  )
}
