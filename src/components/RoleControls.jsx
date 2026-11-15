import { useState } from 'react'
import { ROLES, roleQuestion } from '../lib/admin.js'
import { must, nameOf } from '../lib/data.js'
import { supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { Notice, SearchSelect, SelectField } from './ui.jsx'

// Admin only (the database refuses anyone else): the person's role, and for a
// mentor, the hubs they look after. The person gets a message on the site for each change.
export function RoleSection({ person, isMe, hubs, initialHubs, onRoleChanged }) {
  const [role, setRole] = useState(person.role)
  return (
    <section className="section">
      <h2>Role</h2>
      <PersonRole
        person={person}
        role={role}
        isMe={isMe}
        onChanged={(next) => {
          setRole(next)
          onRoleChanged?.(next)
        }}
      />
      {role === 'mentor' && <HubPicker mentor={person} hubs={hubs} initial={initialHubs} />}
    </section>
  )
}

function PersonRole({ person, role, isMe, onChanged }) {
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const name = person.full_name || person.email

  async function change(next) {
    setResult(null)
    if (next === role || !window.confirm(roleQuestion(name, next))) return
    setBusy(true)
    const { data, error } = await supabase.from('profiles').update({ role: next }).eq('id', person.id).select('id')
    setBusy(false)
    if (error) return setResult({ kind: 'error', text: errorMessage(error) })
    if (!data.length) return setResult({ kind: 'error', text: MSG.notAllowed })
    setResult({ kind: 'ok', text: `Saved. ${name} will see a message about it.` })
    onChanged(next)
  }

  return (
    <>
      <SelectField
        id="person-role"
        label="Role"
        hint={isMe ? 'You cannot change your own role.' : 'Students see only their own work. Mentors see the hubs you give them.'}
        options={ROLES}
        placeholder="Choose…"
        value={role}
        disabled={isMe || busy}
        onChange={(e) => e.target.value && change(e.target.value)}
      />
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
    </>
  )
}

// Chosen hubs as chips (× to take one away), and a search box to add another.
// Each change saves at once.
function HubPicker({ mentor, hubs, initial }) {
  const [mine, setMine] = useState(initial)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const name = mentor.full_name || mentor.email

  async function run(work, next, text) {
    setBusy(true)
    setResult(null)
    try {
      must(await work)
      setMine(next)
      setResult({ kind: 'ok', text })
    } catch (error) {
      setResult({ kind: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  function add(hubId) {
    if (!hubId || mine.includes(hubId)) return
    run(
      supabase.from('mentor_hubs').insert({ mentor_id: mentor.id, hub_id: hubId }).select('hub_id'),
      [...mine, hubId],
      `Added ${nameOf(hubs, hubId)}.`,
    )
  }

  function remove(hubId) {
    const hub = nameOf(hubs, hubId)
    if (!window.confirm(`Take ${hub} away from ${name}? They will no longer see its students.`)) return
    run(
      supabase.from('mentor_hubs').delete().eq('mentor_id', mentor.id).eq('hub_id', hubId).select('hub_id'),
      mine.filter((h) => h !== hubId),
      `Removed ${hub}.`,
    )
  }

  const chosen = hubs.filter((h) => mine.includes(h.id))
  const left = hubs.filter((h) => !mine.includes(h.id))

  return (
    <div className="section-gap">
      <h3>Hubs {name} looks after</h3>
      {chosen.length === 0 ? (
        <p className="hint">None yet. A mentor with no hubs sees no students.</p>
      ) : (
        <ul className="chips" aria-label="Hubs">
          {chosen.map((h) => (
            <li key={h.id} className="chip">
              {h.name}
              <button
                type="button"
                className="link-button"
                aria-label={`Remove ${h.name}`}
                disabled={busy}
                onClick={() => remove(h.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {left.length > 0 && (
        <SearchSelect
          id="add-hub"
          label="Add a hub"
          placeholder="Type part of a hub name, like tourism"
          options={left.map((h) => ({ value: h.id, label: h.name }))}
          value=""
          disabled={busy}
          onChange={(e) => add(e.target.value)}
        />
      )}
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
    </div>
  )
}
