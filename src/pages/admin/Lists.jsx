import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button, LoadError, Notice, SelectField, Spinner } from '../../components/ui.jsx'
import { forgetLists, loadLists, useLoad } from '../../lib/data.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, required, requiredChoice } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'

// One tab per list. `extra` is the second field some lists have.
const TABS = [
  { key: 'campuses', label: 'Campuses', table: 'campuses' },
  { key: 'departments', label: 'Departments', table: 'departments', extra: { field: 'code', label: 'Code' } },
  { key: 'programmes', label: 'Programmes', table: 'programmes', extra: { field: 'department_id', label: 'Department', kind: 'department' } },
  { key: 'levels', label: 'Levels of study', table: 'study_levels', extra: { field: 'position', label: 'Order', kind: 'number' } },
  { key: 'clusters', label: 'Clusters', table: 'clusters' },
  {
    key: 'hubs',
    label: 'Hubs',
    table: 'hubs',
    extra: { field: 'short_name', label: 'Short name', hint: 'Used as the Excel tab name. 31 characters at most.', maxLength: 31 },
  },
  { key: 'sectors', label: 'Business sectors', table: 'sectors' },
  { key: 'supportTypes', label: 'Support types', table: 'support_types' },
]

async function freshLists() {
  forgetLists()
  return loadLists()
}

// Links the database would quietly cascade or clear instead of refusing the delete.
const QUIET_LINKS = {
  support_types: [['student_support', 'support_type_id']],
  hubs: [
    ['lessons', 'hub_id'],
    ['mentor_hubs', 'hub_id'],
  ],
}

async function inUse(table, id) {
  for (const [other, column] of QUIET_LINKS[table] ?? []) {
    const { count, error } = await supabase.from(other).select('*', { count: 'exact', head: true }).eq(column, id)
    if (error) throw error
    if (count > 0) return true
  }
  return false
}

function listError(error) {
  if (error?.code === '23505') return 'That name is already on the list.'
  if (error?.code === '23503') return 'This is in use, so it cannot be deleted.'
  return errorMessage(error)
}

export function Lists() {
  useTitle('Dropdown lists')
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.key === params.get('list')) ?? TABS[0]
  const page = useLoad(freshLists, [])

  return (
    <>
      <h1>Dropdown lists</h1>
      <p className="lede">
        These are the choices students see on the forms. Renaming a choice changes it everywhere. You cannot delete a
        choice that is in use.
      </p>
      <div className="tabs tabs-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={t.key === tab.key}
            onClick={() => setParams({ list: t.key }, { replace: true })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {page.loading ? (
        <Spinner />
      ) : page.error ? (
        <LoadError error={page.error} onRetry={page.reload} />
      ) : (
        <>
          <ListEditor key={tab.key} tab={tab} initial={page.data[tab.key]} departments={page.data.departments} />
          {tab.key === 'hubs' && <HubClusters hubs={page.data.hubs} clusters={page.data.clusters} />}
        </>
      )}
    </>
  )
}

function sortRows(tab, rows, departments) {
  const dept = (id) => departments.find((d) => d.id === id)?.name ?? ''
  return [...rows].sort((a, b) => {
    if (tab.key === 'levels') return a.position - b.position
    if (tab.key === 'programmes') return dept(a.department_id).localeCompare(dept(b.department_id)) || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name)
  })
}

function ListEditor({ tab, initial, departments }) {
  const [rows, setRows] = useState(() => sortRows(tab, initial, departments))
  const [deleted, setDeleted] = useState(false)

  function changed(next) {
    forgetLists() // other pages load the new choices
    setRows(sortRows(tab, next, departments))
  }

  return (
    <>
    {deleted && <Notice kind="ok">Deleted.</Notice>}
    <ul className="rows list-editor">
      {rows.map((row) => (
        <li key={row.id} className="row">
          <ListRow
            tab={tab}
            row={row}
            departments={departments}
            onSaved={(r) => changed(rows.map((x) => (x.id === r.id ? r : x)))}
            onDeleted={(id) => {
              changed(rows.filter((x) => x.id !== id))
              setDeleted(true)
            }}
          />
        </li>
      ))}
      <li className="row">
        <ListRow tab={tab} departments={departments} onSaved={(r) => changed([...rows, r])} />
      </li>
    </ul>
    </>
  )
}

const toForm = (tab, row) => ({
  name: row?.name ?? '',
  extra: tab.extra ? String(row?.[tab.extra.field] ?? '') : '',
})

// One editable row, or the empty "add" row when `row` is missing.
function ListRow({ tab, row, departments, onSaved, onDeleted }) {
  const [form, setForm] = useState(() => toForm(tab, row))
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState('')
  const base = row ? `${tab.key}-${row.id}` : `${tab.key}-new`
  const extra = tab.extra

  const set = (key) => (e) => {
    setResult(null)
    setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function check() {
    const next = { name: form.name.trim() ? '' : required('name') }
    if (extra) {
      const v = form.extra.trim()
      if (extra.kind === 'department') next.extra = v ? '' : requiredChoice('department')
      else if (extra.kind === 'number') next.extra = /^-?\d+$/.test(v) ? '' : required('order')
      else next.extra = v ? '' : required(extra.label.toLowerCase())
    }
    setErrors(next)
    const bad = Object.keys(next).find((k) => next[k])
    if (bad) document.getElementById(`${base}-${bad}`)?.focus()
    return !bad
  }

  async function save(e) {
    e.preventDefault()
    setResult(null)
    if (!check()) return
    const values = { name: form.name.trim() }
    if (extra) values[extra.field] = extra.kind === 'number' ? Number(form.extra) : form.extra.trim()
    setBusy('save')
    const query = row
      ? supabase.from(tab.table).update(values).eq('id', row.id)
      : supabase.from(tab.table).insert(values)
    const { data, error } = await query.select().maybeSingle()
    setBusy('')
    if (error) return setResult({ kind: 'error', text: listError(error) })
    if (!data) return setResult({ kind: 'error', text: MSG.notAllowed })
    if (!row) setForm(toForm(tab, null)) // clear the add row
    setResult({ kind: 'ok', text: 'Saved.' })
    onSaved(data)
  }

  async function remove() {
    setResult(null)
    if (!window.confirm(`Delete "${row.name}"?`)) return
    setBusy('delete')
    try {
      if (await inUse(tab.table, row.id)) {
        setBusy('')
        return setResult({ kind: 'error', text: listError({ code: '23503' }) })
      }
    } catch (err) {
      setBusy('')
      return setResult({ kind: 'error', text: listError(err) })
    }
    const { data, error } = await supabase.from(tab.table).delete().eq('id', row.id).select('id')
    setBusy('')
    if (error) return setResult({ kind: 'error', text: listError(error) })
    if (!data.length) return setResult({ kind: 'error', text: MSG.notAllowed })
    onDeleted(row.id)
  }

  return (
    <form onSubmit={save} noValidate className="list-row">
      <div className="list-fields">
        <div className="field">
          <label htmlFor={`${base}-name`}>Name</label>
          <input
            id={`${base}-name`}
            value={form.name}
            onChange={set('name')}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        {extra && (
          <div className={`field ${extra.kind === 'number' ? 'field-short' : ''}`}>
            <label htmlFor={`${base}-extra`}>{extra.label}</label>
            {extra.hint && !row && <p className="hint">{extra.hint}</p>}
            {extra.kind === 'department' ? (
              <select id={`${base}-extra`} value={form.extra} onChange={set('extra')} aria-invalid={errors.extra ? true : undefined}>
                <option value="">Choose…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`${base}-extra`}
                value={form.extra}
                onChange={set('extra')}
                inputMode={extra.kind === 'number' ? 'numeric' : undefined}
                maxLength={extra.maxLength}
                aria-invalid={errors.extra ? true : undefined}
              />
            )}
            {errors.extra && <p className="field-error">{errors.extra}</p>}
          </div>
        )}
      </div>
      <div className="actions">
        {row ? (
          <>
            <Button type="submit" variant="secondary" busy={busy === 'save'} busyLabel={MSG.saving} disabled={Boolean(busy)}>
              Save
            </Button>
            <Button type="button" variant="danger" busy={busy === 'delete'} disabled={Boolean(busy)} onClick={remove}>
              Delete
            </Button>
          </>
        ) : (
          <Button type="submit" busy={busy === 'save'} busyLabel={MSG.saving} disabled={Boolean(busy)}>
            Add
          </Button>
        )}
      </div>
      {result && <Notice kind={result.kind}>{result.text}</Notice>}
    </form>
  )
}

// Which cluster each hub sits in. Students no longer pick a cluster: it comes from their hub.
// The first links were a guess, so CBE should check them here.
function HubClusters({ hubs, clusters }) {
  const [rows, setRows] = useState(() => [...hubs].sort((a, b) => a.name.localeCompare(b.name)))
  const [result, setResult] = useState(null) // { id, kind, text }

  async function change(hub, clusterId) {
    setResult(null)
    const { data, error } = await supabase
      .from('hubs')
      .update({ cluster_id: clusterId || null })
      .eq('id', hub.id)
      .select('id')
    if (error || !data.length) return setResult({ id: hub.id, kind: 'error', text: error ? listError(error) : MSG.notAllowed })
    forgetLists()
    setRows((list) => list.map((h) => (h.id === hub.id ? { ...h, cluster_id: clusterId || null } : h)))
    setResult({ id: hub.id, kind: 'ok', text: 'Saved.' })
  }

  return (
    <section className="section">
      <h2>Which cluster each hub is in</h2>
      <p className="hint">
        Students do not choose a cluster any more: it comes from their hub. These were filled in as a first guess.
        Please check them with CBE. A new hub appears here after you reload the page.
      </p>
      <ul className="rows">
        {rows.map((h) => (
          <li key={h.id} className="row">
            <SelectField
              id={`cluster-${h.id}`}
              label={h.name}
              placeholder="No cluster"
              options={clusters.map((c) => ({ value: c.id, label: c.name }))}
              value={h.cluster_id ?? ''}
              onChange={(e) => change(h, e.target.value)}
            />
            {result?.id === h.id && <Notice kind={result.kind}>{result.text}</Notice>}
          </li>
        ))}
      </ul>
    </section>
  )
}
