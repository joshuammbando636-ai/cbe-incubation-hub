import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { Button, Checkbox, LoadError, Notice, Spinner } from '../../components/ui.jsx'
import { ROLES, cleanSearch, diff, roleQuestion } from '../../lib/admin.js'
import { loadLists, must, useLoad } from '../../lib/data.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadPeople() {
  const [lists, staff, assignments] = await Promise.all([
    loadLists(),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['mentor', 'admin'])
      .order('full_name')
      .then(must),
    supabase.from('mentor_hubs').select('mentor_id, hub_id').then(must),
  ])
  return { hubs: lists.hubs, staff, assignments }
}

export function People() {
  useTitle('People and roles')
  const page = useLoad(loadPeople, [])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <PeopleBody {...page.data} />
}

const byName = (a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email)

function PeopleBody({ hubs, staff: initialStaff, assignments }) {
  const { profile: me } = useAuth()
  const [staff, setStaff] = useState(initialStaff)

  // Keep the "Mentors and admins" list in step when a role changes anywhere.
  function roleChanged(person, role) {
    setStaff((list) => {
      const rest = list.filter((p) => p.id !== person.id)
      return role === 'student' ? rest : [...rest, { ...person, role }].sort(byName)
    })
  }

  const hubsOf = (id) => assignments.filter((a) => a.mentor_id === id).map((a) => a.hub_id)

  return (
    <div className="narrow-content">
      <h1>People and roles</h1>
      <p className="lede">
        Make someone a mentor, then choose the hubs they look after. A mentor with no hubs sees no students.
      </p>

      <section className="section">
        <h2>Mentors and admins</h2>
        <ul className="rows">
          {staff.map((p) => (
            <li key={`${p.id}-${p.role}`} className="row">
              <PersonRole person={p} isMe={p.id === me.id} onChanged={roleChanged} />
              {p.role === 'mentor' && <MentorHubs mentorId={p.id} hubs={hubs} initial={hubsOf(p.id)} />}
            </li>
          ))}
        </ul>
      </section>

      <FindPerson meId={me.id} onChanged={roleChanged} />
    </div>
  )
}

function PersonRole({ person, isMe, onChanged }) {
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

function FindPerson({ meId, onChanged }) {
  const [q, setQ] = useState('')
  const [state, setState] = useState({ results: null, error: null })

  useEffect(() => {
    const term = cleanSearch(q)
    if (!term) return
    let stale = false
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .order('full_name')
        .limit(20)
      if (!stale) setState({ results: data, error })
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [q])

  const searching = Boolean(cleanSearch(q))

  return (
    <section className="section">
      <h2>Find a person</h2>
      <div className="field">
        <label htmlFor="find">Search</label>
        <input id="find" type="search" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {searching && state.error && <Notice kind="error">{errorMessage(state.error)}</Notice>}
      {searching && state.results && (
        state.results.length === 0 ? (
          <p className="section-gap">No one matches.</p>
        ) : (
          <ul className="rows section-gap">
            {state.results.map((p) => (
              <li key={p.id} className="row">
                <PersonRole person={p} isMe={p.id === meId} onChanged={onChanged} />
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}
