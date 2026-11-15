import { useState } from 'react'
import { useAuth } from '../auth/context.js'
import { avatarChoices, avatarFor, avatarSrc } from '../lib/avatars.js'
import { supabase } from '../lib/supabase.js'
import { errorMessage } from '../lib/text.js'

const label = (name) => {
  const [gender, n] = name.split('-')
  return `${gender === 'female' ? 'Female' : 'Male'} picture ${n}`
}

// Pick one of the drawings as your profile picture. Saves on click.
// `gender` is the form's current choice, so the list follows it as you edit.
export function AvatarPicker({ gender, title = 'Pick a profile picture', hint }) {
  const { profile, updateProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = avatarFor({ avatar: profile.avatar, gender: gender || profile.gender })

  async function pick(name) {
    if (busy || name === profile.avatar) return
    setBusy(true)
    setError('')
    const before = profile.avatar ?? null
    updateProfile({ avatar: name })
    const { data, error: err } = await supabase.from('profiles').update({ avatar: name }).eq('id', profile.id).select('id')
    if (err || !data?.length) {
      updateProfile({ avatar: before })
      // 42703 (Postgres) or PGRST204 (Supabase API): the avatar column is missing,
      // i.e. migration 006 has not been run yet.
      const missing = err?.code === '42703' || err?.code === 'PGRST204'
      setError(missing ? 'Pictures are not switched on yet. Please try again later.' : errorMessage(err ?? { code: '42501' }))
    }
    setBusy(false)
  }

  return (
    <fieldset className="avatar-pick" disabled={busy}>
      <legend className="avatar-pick-title">{title}</legend>
      {hint && <p className="avatar-pick-hint">{hint}</p>}
      <div className="avatar-pick-grid">
        {avatarChoices(gender || profile.gender).map((name) => (
          <label key={name} className="avatar-pick-item">
            <input
              type="radio"
              name="avatar"
              value={name}
              checked={current === name}
              onChange={() => pick(name)}
              className="visually-hidden"
            />
            <img src={avatarSrc(name)} alt={label(name)} width="64" height="64" loading="lazy" />
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
