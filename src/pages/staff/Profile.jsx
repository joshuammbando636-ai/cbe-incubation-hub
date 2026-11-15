import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { AvatarPicker } from '../../components/AvatarPicker.jsx'
import { PasswordForm } from '../../components/PasswordForm.jsx'
import { Button, Field, LoadError, Notice, SelectField, Spinner } from '../../components/ui.jsx'
import { must, useLoad } from '../../lib/data.js'
import { GENDERS } from '../../lib/labels.js'
import { checkPhone, cleanPhone } from '../../lib/student.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { checkFullName, firstError } from '../../lib/validate.js'

const loadMe = (id) => supabase.from('profiles').select('id, full_name, email, gender, phone').eq('id', id).single().then(must)

// Mentors and admins: their own name, phone and password.
export function StaffProfile() {
  useTitle('Your profile')
  const { profile: me } = useAuth()
  const page = useLoad(() => loadMe(me.id), [me.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return (
    <div className="narrow-content">
      <h1>Your profile</h1>
      <p className="lede">Students see your name as their mentor. Keep it correct.</p>
      <section className="form-section">
        <AvatarPicker title="Profile picture" hint="Shown next to your name. Pick the one you like." />
      </section>
      <DetailsForm key={page.data.id} profile={page.data} />
      <PasswordForm />
    </div>
  )
}

function DetailsForm({ profile }) {
  const { updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    gender: profile.gender ?? '',
    phone: profile.phone ?? '',
  })
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const bind = (key) => ({
    value: form[key],
    onChange: (e) => (setResult(null), setForm((f) => ({ ...f, [key]: e.target.value }))),
    error: errors[key],
  })

  async function submit(e) {
    e.preventDefault()
    const next = { full_name: checkFullName(form.full_name), phone: checkPhone(form.phone) }
    setErrors(next)
    setResult(null)
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const patch = {
      full_name: form.full_name.trim().replace(/\s+/g, ' '),
      gender: form.gender || null,
      phone: cleanPhone(form.phone) || null,
    }
    setBusy(true)
    try {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select('id')
      if (error) throw error
      if (!data.length) throw { code: '42501' }
      setForm({ full_name: patch.full_name, gender: patch.gender ?? '', phone: patch.phone ?? '' })
      updateProfile({ full_name: patch.full_name, gender: patch.gender })
      setResult({ kind: 'ok', text: 'Profile saved.' })
    } catch (error) {
      setResult({ kind: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="form">
      <section className="form-section">
        <h2>About you</h2>
        <Field id="full_name" label="Full name" hint="First and last name." autoComplete="name" {...bind('full_name')} />
        <SelectField id="gender" label="Gender" options={GENDERS} {...bind('gender')} />
        <Field id="phone" label="Phone number" type="tel" autoComplete="tel" {...bind('phone')} />
        <Field
          id="email"
          label="Email"
          hint="You cannot change your email here."
          value={profile.email}
          readOnly
          className="read-only"
        />
      </section>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
      <div className="actions">
        <Button type="submit" busy={busy} busyLabel={MSG.saving}>
          Save profile
        </Button>
      </div>
    </form>
  )
}
