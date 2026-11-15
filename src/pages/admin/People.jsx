import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { Button, Checkbox, LoadError, Notice, Spinner } from '../../components/ui.jsx'
import { ROLES, diff, filterPeople, roleQuestion } from '../../lib/admin.js'
import { loadLists, must, nameOf, useLoad } from '../../lib/data.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadPeople() {
  const [lists, people, assignments] = await Promise.all([
    loadLists(),
    supabase.from('profiles').select('id, full_name, email, role, hub_id').order('full_name').then(must),
    supabase.from('mentor_hubs').select('mentor_id, hub_id').then(must),
  ])
  return { hubs: lists.hubs, people: people.sort(byName), assignments }
}

export function People() {
  useTitle('People and roles')
  const page = useLoad(loadPeople, [])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <PeopleBody {...page.data} />
}

const byName = (a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email)

const SHOW = [
  { value: 'all', label: 'Everyone' },
  { value: 'student', label: 'Students' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'admin', label: 'Admins' },
]
const PAGE = 50 // rows shown at once; "Show more" adds the next lot

function PeopleBody({ hubs, people: initialPeople, assignments }) {
  const { profile: me } = useAuth()
  const [people, setPeople] = useState(initialPeople)
  const [show, setShow] = useState('all')
  const [text, setText] = useState('')
  const [limit, setLimit] = useState(PAGE)

  // Keep the list in step when a role changes (the person may move to another tab).
  function roleChanged(person, role) {
    setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, role } : p)))
  }

  const hubsOf = (id) => assignments.filter((a) => a.mentor_id === id).map((a) => a.hub_id)
  const count = (role) => (role === 'all' ? people.length : people.filter((p) => p.role === role).length)
  const shown = filterPeople(people, show, text)

  return (
    <div className="narrow-content">
      <h1>People and roles</h1>
      <p className="lede">
        Everyone with an account starts as a student. Pick a person, make them a mentor, then choose the hubs they look
        after. A mentor with no hubs sees no students. They get a message on the site when you do this.
      </p>

      <div className="tabs tabs-wrap" role="group" aria-label="Show">
        {SHOW.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={show === t.value}
            onClick={() => {
              setShow(t.value)
              setLimit(PAGE)
            }}
          >
            {t.label} ({count(t.value)})
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="find">Filter</label>
        <input
          id="find"
          type="search"
          placeholder="Type part of a name or email"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setLimit(PAGE)
          }}
        />
      </div>

      <p className="hint" aria-live="polite">
        {shown.length === 1 ? '1 person' : `${shown.length} people`}
      </p>
      {shown.length === 0 ? (
        <p className="section-gap">No one matches.</p>
      ) : (
        <ul className="rows">
          {shown.slice(0, limit).map((p) => (
            <li key={`${p.id}-${p.role}`} className="row">
              <PersonRole
                person={p}
                hubName={p.role === 'student' ? nameOf(hubs, p.hub_id) : ''}
                isMe={p.id === me.id}
                onChanged={roleChanged}
              />
              {p.role === 'mentor' && <MentorHubs mentorId={p.id} hubs={hubs} initial={hubsOf(p.id)} />}
            </li>
          ))}
        </ul>
      )}
      {shown.length > limit && (
        <Button type="button" variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>
          Show more ({shown.length - limit} left)
        </Button>
      )}
    </div>
  )
}

function PersonRole({ person, hubName, isMe, onChanged }) {
  const [role, setRole] = useState(person.role)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const id = `role-${person.id}`
  const name = person.full_name || person.email

  async function change(next) {
    setResult(null)
    if (next === role || !window.confirm(roleQuestion(name, next))) return
    setBusy(true)
    const { data, error } = await supabase.from('profiles').update({ role: next }).eq('id', person.id).select('id')
    setBusy(false)
    if (error) return setResult({ kind: 'error', text: errorMessage(error) })
    if (!data.length) return setResult({ kind: 'error', text: MSG.notAllowed })
    setRole(next)
    setResult({ kind: 'ok', text: 'Saved.' })
    onChanged(person, next)
  }

  return (
    <div className="person">
      <div className="person-who">
        <p className="row-title">{name}</p>
        <p className="row-meta break">{person.email}</p>
        {hubName && <p className="row-meta">{hubName}</p>}
        {!person.full_name && <p className="row-meta">No name yet</p>}
      </div>
      <div className="person-role">
        <label htmlFor={id} className="visually-hidden">
          Role for {name}
        </label>
        <select id={id} value={role} disabled={isMe || busy} onChange={(e) => change(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {isMe && <p className="hint">You cannot change your own role.</p>}
      </div>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
    </div>
  )
}

function MentorHubs({ mentorId, hubs, initial }) {
  const [saved, setSaved] = useState(initial)
  const [startOpen] = useState(initial.length === 0) // open once for a mentor with no hubs
  const [ticked, setTicked] = useState(() => new Set(initial))
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  function tick(id, on) {
    setResult(null)
    setTicked((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function save() {
    const { add, remove } = diff(saved, ticked)
    setBusy(true)
    try {
      if (remove.length) must(await supabase.from('mentor_hubs').delete().eq('mentor_id', mentorId).in('hub_id', remove))
      if (add.length) must(await supabase.from('mentor_hubs').insert(add.map((hub_id) => ({ mentor_id: mentorId, hub_id }))))
      setSaved([...ticked])
      setResult({ kind: 'ok', text: 'Saved.' })
    } catch (error) {
      setResult({ kind: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="hub-ticks" open={startOpen}>
      <summary>
        Hubs ({ticked.size})
      </summary>
      <fieldset className="choice-group">
        <legend className="visually-hidden">Hubs this mentor looks after</legend>
        {hubs.map((h) => (
          <Checkbox key={h.id} label={h.name} checked={ticked.has(h.id)} onChange={(on) => tick(h.id, on)} />
        ))}
      </fieldset>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
      <Button type="button" variant="secondary" busy={busy} busyLabel={MSG.saving} onClick={save}>
        Save hubs
      </Button>
    </details>
  )
}
