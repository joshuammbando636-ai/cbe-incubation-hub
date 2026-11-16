import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { RowDelete } from '../../components/RowDelete.jsx'
import { Button, Field, LoadError, Notice, SelectField, Spinner } from '../../components/ui.jsx'
import { must, useLoad } from '../../lib/data.js'
import {
  formatDateTime,
  fromLocalInput,
  isMeetingLink,
  meetingAudience,
  splitMeetings,
  toLocalInput,
} from '../../lib/notices.js'
import { loadScope } from '../../lib/staffData.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, required, requiredChoice } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { firstError } from '../../lib/validate.js'

async function loadPage(profile) {
  const [scope, meetings, students] = await Promise.all([
    loadScope(profile),
    supabase.from('meetings').select('*').order('starts_at').then(must),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name').then(must),
  ])
  return { ...scope, meetings, students }
}

export function Meetings() {
  useTitle('Meetings')
  const { profile } = useAuth()
  const page = useLoad(() => loadPage(profile), [profile.id])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <MeetingsBody data={page.data} userId={profile.id} />
}

function MeetingsBody({ data, userId }) {
  const [meetings, setMeetings] = useState(data.meetings)
  const [editing, setEditing] = useState(null) // null | 'new' | meeting row
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState('')
  const students = data.students.map((s) => ({ ...s, full_name: s.full_name || s.email }))
  const allHubs = data.lists.hubs

  if (editing) {
    const meeting = editing === 'new' ? null : editing
    return (
      <MeetingForm
        meeting={meeting}
        isAdmin={data.isAdmin}
        hubs={data.hubs}
        students={students}
        onCancel={() => setEditing(null)}
        onSaved={(row) => {
          setMeetings((ms) => [...ms.filter((m) => m.id !== row.id), row])
          setMessage('Meeting saved.')
          setEditing(null)
        }}
        onDeleted={(id) => {
          setMeetings((ms) => ms.filter((m) => m.id !== id))
          setMessage('Meeting deleted.')
          setEditing(null)
        }}
      />
    )
  }

  const { upcoming, past } = splitMeetings(meetings)
  const row = (m) => (
    <li key={m.id} className="row meeting-row">
      <div className="meeting-main">
        <p className="row-title">{m.title}</p>
        <p className="row-meta">
          {formatDateTime(m.starts_at)} · {meetingAudience(m, allHubs, students)}
        </p>
      </div>
      <a href={m.link} target="_blank" rel="noopener noreferrer" className="link-btn link-btn--small link-btn--out">
        Join<span className="visually-hidden"> {m.title} (opens in a new tab)</span>
      </a>
      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMessage('')
          setEditing(m)
        }}
      >
        Edit<span className="visually-hidden"> {m.title}</span>
      </button>
      {(data.isAdmin || m.created_by === userId) && (
        <RowDelete
          table="meetings"
          id={m.id}
          name={m.title}
          confirmText={`Delete "${m.title}"? Students will no longer see it.`}
          onError={(text) => {
            setMessage('')
            setProblem(text)
          }}
          onDone={(id) => {
            setMeetings((ms) => ms.filter((x) => x.id !== id))
            setProblem('')
            setMessage('Meeting deleted.')
          }}
        />
      )}
    </li>
  )

  return (
    <>
      <h1>Meetings</h1>
      <p className="lede">Plan an online class or call. Students see it on their Notices page.</p>
      {message && <Notice kind="ok">{message}</Notice>}
      {problem && <Notice kind="error">{problem}</Notice>}
      <p>
        <Button
          type="button"
          onClick={() => {
            setMessage('')
            setEditing('new')
          }}
        >
          Plan a meeting
        </Button>
      </p>

      <section className="section">
        <h2>Coming up</h2>
        {upcoming.length === 0 ? <p>No meetings planned.</p> : <ul className="rows">{upcoming.map(row)}</ul>}
      </section>

      {past.length > 0 && (
        <section className="section">
          <h2>Past</h2>
          <ul className="rows">{past.slice(0, 20).map(row)}</ul>
        </section>
      )}
    </>
  )
}

// "Who is it for?" is one dropdown: everyone (admins only), a hub, or one student.
const ONE_STUDENT = 'student'
const audienceOf = (m) => (m?.student_id ? ONE_STUDENT : m?.hub_id ?? '')

function MeetingForm({ meeting, isAdmin, hubs, students, onCancel, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: meeting?.title ?? '',
    starts_at: toLocalInput(meeting?.starts_at),
    link: meeting?.link ?? '',
    audience: audienceOf(meeting),
    student_id: meeting?.student_id ?? '',
    note: meeting?.note ?? '',
  })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')
  useTitle(meeting ? meeting.title : 'Plan a meeting')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const audienceOptions = [
    ...hubs.map((h) => ({ value: h.id, label: h.name })),
    { value: ONE_STUDENT, label: 'One student' },
  ]

  async function submit(e) {
    e.preventDefault()
    const link = form.link.trim()
    const startsAt = fromLocalInput(form.starts_at)
    const next = {
      title: form.title.trim() ? '' : required('title'),
      starts_at: startsAt ? '' : 'Choose the date and time.',
      link: !link ? required('meeting link') : isMeetingLink(link) ? '' : 'Paste a meeting link that starts with https://',
      audience: isAdmin || form.audience ? '' : 'Choose who the meeting is for.',
      student_id: form.audience === ONE_STUDENT && !form.student_id ? requiredChoice('student') : '',
    }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const oneStudent = form.audience === ONE_STUDENT
    const row = {
      title: form.title.trim(),
      starts_at: startsAt,
      link,
      note: form.note.trim() || null,
      hub_id: oneStudent ? null : form.audience || null,
      student_id: oneStudent ? form.student_id : null,
    }
    setBusy('save')
    const query = meeting
      ? supabase.from('meetings').update(row).eq('id', meeting.id)
      : supabase.from('meetings').insert(row)
    const { data, error } = await query.select().maybeSingle()
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data) return setProblem(MSG.notAllowed)
    onSaved(data)
  }

  async function remove() {
    if (!window.confirm('Delete this meeting? Students will no longer see it.')) return
    setBusy('delete')
    const { data, error } = await supabase.from('meetings').delete().eq('id', meeting.id).select('id')
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data.length) return setProblem(MSG.notAllowed)
    onDeleted(meeting.id)
  }

  return (
    <div className="narrow-content">
      <h1>{meeting ? meeting.title : 'Plan a meeting'}</h1>
      <form onSubmit={submit} noValidate className="form">
        {problem && <Notice kind="error">{problem}</Notice>}
        <Field id="title" label="Title" value={form.title} onChange={set('title')} error={errors.title} />
        <Field
          id="starts_at"
          label="Date and time"
          type="datetime-local"
          value={form.starts_at}
          onChange={set('starts_at')}
          error={errors.starts_at}
        />
        <Field
          id="link"
          label="Meeting link"
          hint="Create the meeting in Google Meet, Zoom or Teams, then paste its link."
          type="url"
          inputMode="url"
          value={form.link}
          onChange={set('link')}
          error={errors.link}
        />
        <SelectField
          id="audience"
          label="Who is it for?"
          placeholder={isAdmin ? 'Everyone' : 'Choose…'}
          options={audienceOptions}
          value={form.audience}
          onChange={set('audience')}
          error={errors.audience}
        />
        {form.audience === ONE_STUDENT && (
          <SelectField
            id="student_id"
            label="Student"
            options={students.map((s) => ({ value: s.id, label: s.full_name }))}
            value={form.student_id}
            onChange={set('student_id')}
            error={errors.student_id}
          />
        )}
        <Field
          id="note"
          label="Note (optional)"
          hint="What the meeting is about, or what to prepare."
          multiline
          value={form.note}
          onChange={set('note')}
        />
        <div className="actions">
          <Button type="submit" busy={busy === 'save'} busyLabel={MSG.saving} disabled={Boolean(busy)}>
            Save meeting
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={Boolean(busy)}>
            Cancel
          </Button>
          {meeting && (
            <Button type="button" variant="danger" busy={busy === 'delete'} disabled={Boolean(busy)} onClick={remove}>
              Delete meeting
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
