import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { Button, Checkbox, Field, LoadError, Notice, SelectField, Spinner } from '../../components/ui.jsx'
import { must, nameOf, useLoad } from '../../lib/data.js'
import { loadScope } from '../../lib/staffData.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, required } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { firstError } from '../../lib/validate.js'
import { isYoutubeLink } from '../../lib/youtube.js'

async function loadPage(profile) {
  const [scope, lessons] = await Promise.all([
    loadScope(profile),
    supabase.from('lessons').select('*').order('position').order('created_at').then(must),
  ])
  return { ...scope, lessons }
}

export function StaffLessons() {
  useTitle('Lessons')
  const { profile } = useAuth()
  const page = useLoad(() => loadPage(profile), [profile.id])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <LessonsBody data={page.data} userId={profile.id} />
}

const sortLessons = (list) =>
  [...list].sort((a, b) => a.position - b.position || String(a.created_at).localeCompare(String(b.created_at)))

function LessonsBody({ data, userId }) {
  const [lessons, setLessons] = useState(data.lessons)
  const [editing, setEditing] = useState(null) // null | 'new' | lesson row
  const [message, setMessage] = useState('')
  const allHubs = data.lists.hubs

  if (editing) {
    const lesson = editing === 'new' ? null : editing
    // A mentor picks from their own hubs, but keep a lesson's existing hub.
    const hubs = lesson?.hub_id && !data.hubs.some((h) => h.id === lesson.hub_id)
      ? [...data.hubs, ...allHubs.filter((h) => h.id === lesson.hub_id)]
      : data.hubs
    const nextPosition = lessons.reduce((n, l) => Math.max(n, l.position), 0) + 1
    return (
      <LessonForm
        lesson={lesson}
        hubs={hubs}
        userId={userId}
        nextPosition={nextPosition}
        onCancel={() => setEditing(null)}
        onSaved={(row) => {
          setLessons((ls) => sortLessons([...ls.filter((l) => l.id !== row.id), row]))
          setMessage('Lesson saved.')
          setEditing(null)
        }}
        onDeleted={(id) => {
          setLessons((ls) => ls.filter((l) => l.id !== id))
          setMessage('Lesson deleted.')
          setEditing(null)
        }}
      />
    )
  }

  return (
    <>
      <h1>Lessons</h1>
      {message && <Notice kind="ok">{message}</Notice>}
      <p>
        <Button
          type="button"
          onClick={() => {
            setMessage('')
            setEditing('new')
          }}
        >
          Add a lesson
        </Button>
      </p>

      {lessons.length === 0 ? (
        <section className="section">
          <h2>No lessons yet.</h2>
          <p>Add the first lesson for your students.</p>
        </section>
      ) : (
        <ul className="rows">
          {lessons.map((l) => (
            <li key={l.id} className="row lesson-row">
              <span className="lesson-order">{l.position}</span>
              <div className="lesson-main">
                <p className="row-title">{l.title}</p>
                <p className="row-meta">
                  {l.hub_id ? nameOf(allHubs, l.hub_id) : 'Everyone'} ·{' '}
                  <span className={`status ${l.is_published ? 'status-ok' : ''}`}>
                    {l.is_published ? 'Published' : 'Draft'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMessage('')
                  setEditing(l)
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function LessonForm({ lesson, hubs, userId, nextPosition, onCancel, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: lesson?.title ?? '',
    description: lesson?.description ?? '',
    video_url: lesson?.video_url ?? '',
    hub_id: lesson?.hub_id ?? '',
    position: String(lesson?.position ?? nextPosition),
    is_published: lesson?.is_published ?? false,
  })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')
  useTitle(lesson ? lesson.title : 'Add a lesson')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const url = form.video_url.trim()
    const next = {
      title: form.title.trim() ? '' : required('title'),
      video_url: !url ? required('YouTube link') : isYoutubeLink(url) ? '' : MSG.badYoutube,
      position: /^-?\d+$/.test(form.position.trim()) ? '' : required('order'),
    }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const row = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: url,
      hub_id: form.hub_id || null,
      position: Number(form.position),
      is_published: form.is_published,
    }
    setBusy('save')
    const query = lesson
      ? supabase.from('lessons').update(row).eq('id', lesson.id)
      : supabase.from('lessons').insert({ ...row, created_by: userId })
    const { data, error } = await query.select().maybeSingle()
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data) return setProblem(MSG.notAllowed)
    onSaved(data)
  }

  async function remove() {
    if (!window.confirm("Delete this lesson? Students' ticks for it are deleted too.")) return
    setBusy('delete')
    const { data, error } = await supabase.from('lessons').delete().eq('id', lesson.id).select('id')
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data.length) return setProblem(MSG.notAllowed)
    onDeleted(lesson.id)
  }

  return (
    <div className="narrow-content">
      <h1>{lesson ? lesson.title : 'Add a lesson'}</h1>
      <form onSubmit={submit} noValidate className="form">
        {problem && <Notice kind="error">{problem}</Notice>}
        <Field id="title" label="Title" value={form.title} onChange={set('title')} error={errors.title} />
        <Field id="description" label="Description (optional)" multiline value={form.description} onChange={set('description')} />
        <Field
          id="video_url"
          label="YouTube link"
          hint="Upload to YouTube as Unlisted and paste the link."
          type="url"
          inputMode="url"
          value={form.video_url}
          onChange={set('video_url')}
          error={errors.video_url}
        />
        <SelectField
          id="hub_id"
          label="Who is it for?"
          placeholder="Everyone"
          options={hubs.map((h) => ({ value: h.id, label: h.name }))}
          value={form.hub_id}
          onChange={set('hub_id')}
        />
        <Field
          id="position"
          label="Order"
          hint="Lower numbers come first."
          inputMode="numeric"
          value={form.position}
          onChange={set('position')}
          error={errors.position}
        />
        <div className="field">
          <Checkbox
            label="Published"
            checked={form.is_published}
            onChange={(on) => setForm((f) => ({ ...f, is_published: on }))}
          />
          <p className="hint">Students see a lesson only when it is published.</p>
        </div>
        <div className="actions">
          <Button type="submit" busy={busy === 'save'} busyLabel={MSG.saving} disabled={Boolean(busy)}>
            Save lesson
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={Boolean(busy)}>
            Cancel
          </Button>
          {lesson && (
            <Button type="button" variant="danger" busy={busy === 'delete'} disabled={Boolean(busy)} onClick={remove}>
              Delete lesson
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
