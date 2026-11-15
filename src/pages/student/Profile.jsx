import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { Avatar } from '../../components/Avatar.jsx'
import { AvatarPicker } from '../../components/AvatarPicker.jsx'
import { PasswordForm } from '../../components/PasswordForm.jsx'
import { ProfileForm } from '../../components/ProfileForm.jsx'
import { LoadError, Spinner } from '../../components/ui.jsx'
import { loadLists, must, nameOf, useLoad } from '../../lib/data.js'
import { checkPhoto, uploadPhoto } from '../../lib/photos.js'
import { PROFILE_DETAILS, missingDetails } from '../../lib/student.js'
import { errorMessage } from '../../lib/text.js'
import { supabase } from '../../lib/supabase.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadProfilePage(userId) {
  const [lists, profile, support] = await Promise.all([
    loadLists(),
    supabase.from('profiles').select('*').eq('id', userId).single().then(must),
    supabase.from('student_support').select('support_type_id').eq('student_id', userId).then(must),
  ])
  return { lists, profile, support: support.map((r) => r.support_type_id) }
}

// Short names for the "still missing" buttons.
const DETAIL_NAME = {
  full_name: 'Full name',
  reg_number: 'Reg. number',
  gender: 'Gender',
  phone: 'Phone',
  campus_id: 'Campus',
  department_id: 'Department',
  level_id: 'Level',
  grad_year: 'Graduation year',
  hub_id: 'Hub',
}

export function Profile() {
  useTitle('Your profile')
  const { profile: me, updateProfile } = useAuth()
  const page = useLoad(() => loadProfilePage(me.id), [me.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  const { lists } = page.data
  return (
    <div className="profile-page">
      <h1>Your profile</h1>
      <p className="lede">CBE uses this for the incubation register.</p>
      <ProfileForm
        key={page.data.profile.id}
        {...page.data}
        onSaved={(patch) => updateProfile({ full_name: patch.full_name, gender: patch.gender || null })}
        side={(form) => (
          <>
            <IdCard form={form} lists={lists} />
            <PhotoCard gender={form.gender} />
            <Completeness form={form} />
            <PasswordForm />
          </>
        )}
      />
    </div>
  )
}

// A student card that fills in as you type.
function IdCard({ form, lists }) {
  const { profile } = useAuth()
  const photoPath = profile.photo_path
  const programme = nameOf(lists.programmes, form.programme_id)
  const rows = [
    ['Hub', nameOf(lists.hubs, form.hub_id)],
    ['Programme', programme || nameOf(lists.departments, form.department_id)],
    ['Level', nameOf(lists.levels, form.level_id)],
    ['Campus', nameOf(lists.campuses, form.campus_id)],
  ]
  return (
    <section className="id-card" aria-label="Your student card">
      <div className="id-card-top">
        <span className="id-card-brand">CBE Incubation Hub</span>
        <span>Student card</span>
      </div>
      <div className="id-card-person">
        <Avatar
          name={form.full_name}
          path={photoPath}
          avatar={profile.avatar}
          gender={form.gender}
          className="id-card-photo"
        />
        <div>
          <p className="id-card-name">{form.full_name.trim() || 'Your name'}</p>
          <p className="id-card-reg">{form.reg_number.trim() || '00.00000.00.00.0000'}</p>
        </div>
      </div>
      <dl className="id-card-rows">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// Ring showing how many details are filled in, and a button for each missing one.
function Completeness({ form }) {
  const total = PROFILE_DETAILS.length
  const missing = PROFILE_DETAILS.filter((key) => !String(form[key] ?? '').trim())
  const done = total - missingDetails(form)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <section className="side-card complete">
      <div className="complete-head">
        <svg className="ring" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r={r} className="ring-track" />
          <circle
            cx="32"
            cy="32"
            r={r}
            className="ring-fill"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - done / total)}
          />
        </svg>
        <div>
          <p className="complete-count">
            {done} of {total}
          </p>
          <p className="complete-text">{missing.length ? 'details filled in' : 'All done. Thank you!'}</p>
        </div>
      </div>
      {missing.length > 0 && (
        <ul className="missing">
          {missing.map((key) => (
            <li key={key}>
              <button type="button" onClick={() => document.getElementById(key)?.focus()}>
                {DETAIL_NAME[key]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Add or change the formal photo. Until there is one, this card asks for it
// and offers the drawings to use meanwhile.
function PhotoCard({ gender }) {
  const { profile, updateProfile } = useAuth()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const has = Boolean(profile.photo_path)

  async function choose(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const bad = checkPhoto(file)
    setError(bad)
    if (!file || bad) return
    setBusy(true)
    try {
      const path = await uploadPhoto(profile.id, file, profile.photo_path)
      updateProfile({ photo_path: path })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`side-card photo-card${has ? '' : ' is-missing'}`}>
      {!has && (
        <>
          <p className="photo-card-title">Add a formal photo</p>
          <p className="photo-card-text">Plain background, face clearly visible, like a passport photo. Your mentor sees it.</p>
        </>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={choose} />
      <button
        type="button"
        className={`btn ${has ? 'btn-secondary' : 'btn-primary'}`}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Camera aria-hidden="true" size={18} /> {busy ? 'Uploading…' : has ? 'Change photo' : 'Upload photo'}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {!has && <AvatarPicker gender={gender} title="Or pick a picture for now" />}
    </section>
  )
}
