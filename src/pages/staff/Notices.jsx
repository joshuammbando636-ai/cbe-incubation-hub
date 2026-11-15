import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { RowDelete } from '../../components/RowDelete.jsx'
import { Button, Field, LoadError, Notice, SelectField, Spinner } from '../../components/ui.jsx'
import { must, useLoad } from '../../lib/data.js'
import { formatDate } from '../../lib/labels.js'
import { isWebLink, noticeAudience } from '../../lib/notices.js'
import { loadScope } from '../../lib/staffData.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, required } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { firstError } from '../../lib/validate.js'

async function loadPage(profile) {
  const [scope, notices] = await Promise.all([
    loadScope(profile),
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(100).then(must),
  ])
  return { ...scope, notices }
}

export function StaffNotices() {
  useTitle('Notices')
  const { profile } = useAuth()
  const page = useLoad(() => loadPage(profile), [profile.id])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <NoticesBody data={page.data} userId={profile.id} />
}

function NoticesBody({ data, userId }) {
  const [notices, setNotices] = useState(data.notices)
  const [editing, setEditing] = useState(null) // null | 'new' | notice row
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState('')
  const { lists } = data

  if (editing) {
    const notice = editing === 'new' ? null : editing
    return (
      <NoticeForm
        notice={notice}
        isAdmin={data.isAdmin}
        hubs={data.hubs}
        lists={lists}
        onCancel={() => setEditing(null)}
        onSaved={(row) => {
          setNotices((ns) => [row, ...ns.filter((n) => n.id !== row.id)])
          setMessage(notice ? 'Notice saved.' : 'Notice posted.')
          setEditing(null)
        }}
        onDeleted={(id) => {
          setNotices((ns) => ns.filter((n) => n.id !== id))
          setMessage('Notice deleted.')
          setEditing(null)
        }}
      />
    )
  }

  return (
    <>
      <h1>Notices</h1>
      <p className="lede">Tell a group of students something: a new lesson, a deadline, an event.</p>
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
          Post a notice
        </Button>
      </p>

      {notices.length === 0 ? (
        <section className="section">
          <h2>No notices yet.</h2>
          <p>Post the first one for your students.</p>
        </section>
      ) : (
        <ul className="rows">
          {notices.map((n) => (
            <li key={n.id} className="row meeting-row">
              <div className="meeting-main">
                <p className="row-title">{n.title}</p>
                <p className="row-meta">
                  {formatDate(n.created_at)} · {noticeAudience(n, lists)}
                </p>
              </div>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMessage('')
                  setEditing(n)
                }}
              >
                Edit<span className="visually-hidden"> {n.title}</span>
              </button>
              {(data.isAdmin || n.created_by === userId) && (
                <RowDelete
                  table="notices"
                  id={n.id}
                  name={n.title}
                  confirmText={`Delete "${n.title}"? Students will no longer see it.`}
                  onError={(text) => {
                    setMessage('')
                    setProblem(text)
                  }}
                  onDone={(id) => {
                    setNotices((ns) => ns.filter((x) => x.id !== id))
                    setProblem('')
                    setMessage('Notice deleted.')
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function NoticeForm({ notice, isAdmin, hubs, lists, onCancel, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: notice?.title ?? '',
    body: notice?.body ?? '',
    link: notice?.link ?? '',
    campus_id: notice?.campus_id ?? '',
    hub_id: notice?.hub_id ?? '',
    programme_id: notice?.programme_id ?? '',
  })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')
  useTitle(notice ? notice.title : 'Post a notice')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const options = (list) => list.map((x) => ({ value: x.id, label: x.name }))

  async function submit(e) {
    e.preventDefault()
    const link = form.link.trim()
    const next = {
      title: form.title.trim() ? '' : required('title'),
      body: form.body.trim() ? '' : required('message'),
      link: !link || isWebLink(link) ? '' : 'Paste a web link that starts with https://',
      hub_id: isAdmin || form.hub_id ? '' : 'Choose one of your hubs.',
    }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const row = {
      title: form.title.trim(),
      body: form.body.trim(),
      link: link || null,
      campus_id: form.campus_id || null,
      hub_id: form.hub_id || null,
      programme_id: form.programme_id || null,
    }
    setBusy('save')
    const query = notice
      ? supabase.from('notices').update(row).eq('id', notice.id)
      : supabase.from('notices').insert(row)
    const { data, error } = await query.select().maybeSingle()
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data) return setProblem(MSG.notAllowed)
    onSaved(data)
  }

  async function remove() {
    if (!window.confirm('Delete this notice? Students will no longer see it.')) return
    setBusy('delete')
    const { data, error } = await supabase.from('notices').delete().eq('id', notice.id).select('id')
    setBusy('')
    if (error) return setProblem(errorMessage(error))
    if (!data.length) return setProblem(MSG.notAllowed)
    onDeleted(notice.id)
  }

  return (
    <div className="narrow-content">
      <h1>{notice ? notice.title : 'Post a notice'}</h1>
      <form onSubmit={submit} noValidate className="form">
        {problem && <Notice kind="error">{problem}</Notice>}
        <Field id="title" label="Title" value={form.title} onChange={set('title')} error={errors.title} />
        <Field id="body" label="Message" multiline value={form.body} onChange={set('body')} error={errors.body} />
        <Field
          id="link"
          label="Link (optional)"
          hint="A web page students can open, like a form, a document or a new lesson."
          type="url"
          inputMode="url"
          value={form.link}
          onChange={set('link')}
          error={errors.link}
        />
        <fieldset className="fieldset">
          <legend>Who is it for?</legend>
          <p className="hint">Students see the notice only if they match every choice. Leave a choice empty to include everyone.</p>
          <SelectField
            id="campus_id"
            label="Campus"
            placeholder="All campuses"
            options={options(lists.campuses)}
            value={form.campus_id}
            onChange={set('campus_id')}
          />
          <SelectField
            id="hub_id"
            label="Hub"
            placeholder={isAdmin ? 'All hubs' : 'Choose…'}
            options={options(hubs)}
            value={form.hub_id}
            onChange={set('hub_id')}
            error={errors.hub_id}
          />
          <SelectField
            id="programme_id"
            label="Programme"
            placeholder="All programmes"
            options={options(lists.programmes)}
            value={form.programme_id}
            onChange={set('programme_id')}
          />
        </fieldset>
        <div className="actions">
          <Button type="submit" busy={busy === 'save'} busyLabel={MSG.saving} disabled={Boolean(busy)}>
            {notice ? 'Save notice' : 'Post notice'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={Boolean(busy)}>
            Cancel
          </Button>
          {notice && (
            <Button type="button" variant="danger" busy={busy === 'delete'} disabled={Boolean(busy)} onClick={remove}>
              Delete notice
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
