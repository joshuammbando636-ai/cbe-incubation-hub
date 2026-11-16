import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthShell } from '../components/layouts.jsx'
import { Button, Field, Notice } from '../components/ui.jsx'
import { authRedirect, supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import {
  checkEmail,
  checkFullName,
  checkNewPassword,
  checkSamePassword,
  cleanEmail,
  firstError,
} from '../lib/validate.js'

const TAKEN = 'taken'

export function Signup() {
  useTitle('Create your account')
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const next = {
      fullName: checkFullName(form.fullName),
      email: checkEmail(form.email),
      password: checkNewPassword(form.password),
      confirm: checkSamePassword(form.password, form.confirm),
    }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    setBusy(true)
    const email = cleanEmail(form.email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
        emailRedirectTo: authRedirect('/auth/callback'),
      },
    })
    setBusy(false)

    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists') setProblem(TAKEN)
      else if (error.code === 'weak_password') setErrors({ password: MSG.shortPassword })
      else setProblem(errorMessage(error))
      return
    }
    // With "Confirm email" on, Supabase hides existing accounts by returning a
    // user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) return setProblem(TAKEN)
    if (data.session) return navigate('/', { replace: true }) // only if confirmation is off
    navigate('/check-email', { state: { email } })
  }

  return (
    <AuthShell
      title="Create your account"
      sub="It takes one minute. You fill in your details after you confirm your email."
      line="Every idea needs a hub."
    >
          {problem === TAKEN ? (
            <Notice kind="error">
              <p>
                This email already has an account. <Link to="/login">Sign in</Link>, or{' '}
                <Link to="/forgot-password">reset your password</Link>.
              </p>
            </Notice>
          ) : (
            problem && <Notice kind="error">{problem}</Notice>
          )}

          <form onSubmit={submit} noValidate className="form">
            <Field
              id="fullName"
              label="Full name"
              hint="Your real first and last name, as on your CBE registration. Mentors use it to find you."
              autoComplete="name"
              value={form.fullName}
              onChange={set('fullName')}
              error={errors.fullName}
            />
            <Field
              id="email"
              label="Email"
              hint="Already registered with CBE's incubation programme? Use the same email and we will fill in your details for you."
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />
            <Field
              id="password"
              label="Password"
              hint="At least 8 characters."
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />
            <Field
              id="confirm"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
            />
            <Button type="submit" busy={busy}>
              Create account
            </Button>
          </form>

          <p className="auth-links">
            <Link to="/login">Already have an account? Sign in</Link>
          </p>
    </AuthShell>
  )
}
