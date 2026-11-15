import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { ProfileForm } from '../../components/ProfileForm.jsx'
import { ReviewControls } from '../../components/ReviewControls.jsx'
import {
  Button,
  Checkbox,
  Field,
  LoadError,
  Notice,
  SelectField,
  Spinner,
  StageTracker,
  VideoLink,
  VideoPlayer,
} from '../../components/ui.jsx'
import { nameOf, useLoad } from '../../lib/data.js'
import { GENDERS, STAGES, VIDEO_STATUS, formatDate, stageLabel } from '../../lib/labels.js'
import { loadMentors, loadScope, loadStudent } from '../../lib/staffData.js'
import { missingDetails, missingLabel } from '../../lib/student.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadPage(profile, id) {
  const [scope, student, mentors] = await Promise.all([loadScope(profile), loadStudent(id), loadMentors()])
  return { ...scope, ...student, mentors }
}

// Runs an update and returns { ok } or { text } for the notice.
async function save(query) {
  const { data, error } = await query.select('id')
  if (error) return { kind: 'error', text: errorMessage(error) }
  if (!data.length) return { kind: 'error', text: MSG.notAllowed }
  return { kind: 'ok', text: 'Saved.' }
}

export function Student() {
  const { id } = useParams()
  const { profile: me } = useAuth()
  const back = useLocation().state?.search ?? ''
  const page = useLoad(() => loadPage(me, id), [me.id, id])

  return (
    <div className="narrow-content">
      <p>
        <Link to={`/staff/students${back}`}>All students</Link>
      </p>
      {page.loading ? (
        <Spinner />
      ) : page.error ? (
        <LoadError error={page.error} onRetry={page.reload} />
      ) : !page.data.profile ? (
        <Missing />
      ) : (
        <StudentBody key={id} data={page.data} />
      )}
    </div>
  )
}

function Missing() {
  useTitle('Page not found')
  return (
    <>
      <h1>Page not found</h1>
      <p className="lede">This page does not exist or has moved.</p>
    </>
  )
}

// Where the student stands, before all the detail below.
function Glance({ profile, idea, videos, lessonCount }) {
  const missing = missingDetails(profile)
  const waiting = videos.filter((v) => v.status === 'pending').length
  return (
    <section className="glance" aria-label="Where they stand">
      {idea ? <StageTracker stage={idea.stage} /> : <p>No idea yet.</p>}
      <dl className="facts">
        <div>
          <dt>Profile</dt>
          <dd>{missing ? missingLabel(missing) : 'Complete'}</dd>
        </div>
        <div>
          <dt>Videos waiting</dt>
          <dd>{waiting}</dd>
        </div>
        <div>
          <dt>Lessons</dt>
          <dd>
            {lessonCount.done} of {lessonCount.total} done
          </dd>
        </div>
      </dl>
    </section>
  )
}

function StudentBody({ data }) {
  const { lists, isAdmin, mentors, support } = data
  const [profile, setProfile] = useState(data.profile)
  const [idea, setIdea] = useState(data.idea)
  const [videos, setVideos] = useState(data.videos)
  const [editing, setEditing] = useState(false)
  useTitle(profile.full_name || profile.email)

  const hubName = nameOf(lists.hubs, profile.hub_id)

  function onReviewed(row) {
    setVideos((vs) => vs.map((v) => (v.id === row.id ? row : v)))
    if (row.status === 'verified') setIdea((i) => ({ ...i, stage: row.stage }))
  }

  return (
    <>
      <h1>{profile.full_name || profile.email}</h1>
      <p className="lede">{[profile.reg_number, hubName].filter(Boolean).join(' · ')}</p>

      <Glance profile={profile} idea={idea} videos={videos} lessonCount={data.lessonCount} />

      <section className="section">
        <h2>Details</h2>
        {editing ? (
          <ProfileForm
            mode="staff"
            profile={profile}
            lists={lists}
            isMentor={!isAdmin}
            onSaved={(patch) => setProfile((p) => ({ ...p, ...patch }))}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <Details profile={profile} lists={lists} />
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              Edit details
            </Button>
            {!isAdmin && <p className="small">Only an admin can move a student to another hub.</p>}
          </>
        )}
      </section>

      <section className="section">
        <h2>Business idea</h2>
        {idea ? <IdeaBlock idea={idea} setIdea={setIdea} lists={lists} mentors={mentors} /> : <p>No idea yet.</p>}
      </section>

      <section className="section">
        <h2>Support requested</h2>
        {support.length ? (
          <ul className="plain-list">
            {support.map((sid) => (
              <li key={sid}>{nameOf(lists.supportTypes, sid)}</li>
            ))}
          </ul>
        ) : (
          <p>None ticked.</p>
        )}
      </section>

      <section className="section">
        <h2>Progress videos</h2>
        {videos.length === 0 ? (
          <p>No videos yet.</p>
        ) : (
          <ul className="rows">
            {videos.map((v) => (
              <li key={v.id} className="row">
                <p className="row-head">
                  {stageLabel(v.stage)} · Sent {formatDate(v.created_at)} ·{' '}
                  <span className={`status status-${v.status}`}>{VIDEO_STATUS[v.status]}</span>
                </p>
                <VideoPlayer url={v.video_url} title={`${profile.full_name}: ${stageLabel(v.stage)}`} />
                <p>
                  <VideoLink url={v.video_url} />
                </p>
                {v.note && <p className="quote">{v.note}</p>}
                {v.status === 'pending' ? (
                  <ReviewControls
                    video={v}
                    currentStage={idea.stage}
                    studentName={profile.full_name}
                    onReviewed={onReviewed}
                  />
                ) : (
                  v.feedback && <p>Mentor feedback: {v.feedback}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmBlock profile={profile} setProfile={setProfile} />

      {isAdmin && <MoveBlock profile={profile} setProfile={setProfile} hubs={lists.hubs} />}
    </>
  )
}

function Details({ profile, lists }) {
  const rows = [
    ['Full name', profile.full_name],
    ['Registration number', profile.reg_number],
    ['Gender', GENDERS.find((g) => g.value === profile.gender)?.label],
    ['Phone number', profile.phone],
    ['Email', profile.email],
    ['Campus', nameOf(lists.campuses, profile.campus_id)],
    ['Department', nameOf(lists.departments, profile.department_id)],
    ['Programme', nameOf(lists.programmes, profile.programme_id)],
    ['Level of study', nameOf(lists.levels, profile.level_id)],
    ['Expected graduation year', profile.grad_year],
    ['Cluster', nameOf(lists.clusters, profile.cluster_id)],
    ['Innovation hub', nameOf(lists.hubs, profile.hub_id)],
  ]
  return (
    <dl className="details">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className="break">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function IdeaBlock({ idea, setIdea, lists, mentors }) {
  const [stage, setStage] = useState(idea.stage)
  const [mentor, setMentor] = useState(idea.mentor_id ?? '')
  const [result, setResult] = useState(null) // { kind, text, for }
  const [busy, setBusy] = useState('')

  async function saveStage() {
    if (stage === idea.stage) return
    if (!window.confirm(`Change the stage to ${stageLabel(stage)}?`)) return
    setBusy('stage')
    const r = await save(supabase.from('startup_ideas').update({ stage }).eq('id', idea.id))
    setBusy('')
    setResult({ ...r, for: 'stage' })
    if (r.kind === 'ok') setIdea((i) => ({ ...i, stage }))
  }

  async function saveMentor() {
    setBusy('mentor')
    const r = await save(supabase.from('startup_ideas').update({ mentor_id: mentor || null }).eq('id', idea.id))
    setBusy('')
    setResult({ ...r, for: 'mentor' })
    if (r.kind === 'ok') setIdea((i) => ({ ...i, mentor_id: mentor || null }))
  }

  return (
    <>
      <p className="quote">{idea.description}</p>
      <dl className="details">
        <div>
          <dt>Business name</dt>
          <dd>{idea.business_name || '—'}</dd>
        </div>
        <div>
          <dt>Business sector</dt>
          <dd>{nameOf(lists.sectors, idea.sector_id) || '—'}</dd>
        </div>
        <div>
          <dt>Runs this business</dt>
          <dd>{idea.owns_business ? 'Yes' : 'No'}</dd>
        </div>
      </dl>

      <div className="inline-form">
        <SelectField
          id="idea-stage"
          label="Stage"
          options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          required
        />
        <Button type="button" variant="secondary" busy={busy === 'stage'} busyLabel={MSG.saving} onClick={saveStage}>
          Save stage
        </Button>
      </div>
      {result?.for === 'stage' && <Notice kind={result.kind}>{result.text}</Notice>}

      <div className="inline-form">
        <SelectField
          id="idea-mentor"
          label="Mentor"
          placeholder="No mentor"
          options={mentors.map((m) => ({ value: m.id, label: m.full_name || '—' }))}
          value={mentor}
          onChange={(e) => setMentor(e.target.value)}
        />
        <Button type="button" variant="secondary" busy={busy === 'mentor'} busyLabel={MSG.saving} onClick={saveMentor}>
          Save mentor
        </Button>
      </div>
      {result?.for === 'mentor' && <Notice kind={result.kind}>{result.text}</Notice>}
    </>
  )
}

function ConfirmBlock({ profile, setProfile }) {
  const [flag, setFlag] = useState(profile.needs_review)
  const [note, setNote] = useState(profile.review_note ?? '')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const patch = { needs_review: flag, review_note: note.trim() || null }
    const r = await save(supabase.from('profiles').update(patch).eq('id', profile.id))
    setBusy(false)
    setResult(r)
    if (r.kind === 'ok') setProfile((p) => ({ ...p, ...patch }))
  }

  return (
    <section className="section">
      <h2>Details to confirm</h2>
      <form onSubmit={submit} className="form" noValidate>
        <Checkbox
          label="These details need confirming"
          checked={flag}
          onChange={(on) => {
            setFlag(on)
            setResult(null)
          }}
        />
        <Field
          id="review_note"
          label="Reason"
          hint="The student can read this note."
          multiline
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setResult(null)
          }}
        />
        {result && <Notice kind={result.kind}>{result.text}</Notice>}
        <Button type="submit" busy={busy} busyLabel={MSG.saving}>
          Save
        </Button>
      </form>
    </section>
  )
}

function MoveBlock({ profile, setProfile, hubs }) {
  const [hub, setHub] = useState(profile.hub_id ?? '')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  async function move() {
    if (!hub || hub === profile.hub_id) return
    const name = profile.full_name || profile.email
    if (!window.confirm(`Move ${name} to ${nameOf(hubs, hub)}?`)) return
    setBusy(true)
    const r = await save(supabase.from('profiles').update({ hub_id: hub }).eq('id', profile.id))
    setBusy(false)
    setResult(r)
    if (r.kind === 'ok') setProfile((p) => ({ ...p, hub_id: hub }))
  }

  return (
    <section className="section">
      <h2>Innovation hub</h2>
      <div className="inline-form">
        <SelectField
          id="move-hub"
          label="Innovation hub"
          options={hubs.map((h) => ({ value: h.id, label: h.name }))}
          value={hub}
          onChange={(e) => {
            setHub(e.target.value)
            setResult(null)
          }}
        />
        <Button type="button" variant="secondary" busy={busy} busyLabel={MSG.saving} onClick={move}>
          Move student
        </Button>
      </div>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
    </section>
  )
}
