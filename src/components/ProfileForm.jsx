import { useState } from 'react'
import { nameOf } from '../lib/data.js'
import { GENDERS } from '../lib/labels.js'
import { checkGradYear, checkPhone, checkRegNumber, cleanPhone, cleanRegNumber } from '../lib/student.js'
import { supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { checkFullName, firstError } from '../lib/validate.js'
import { Button, Checkbox, Field, Notice, SearchSelect, SelectField } from './ui.jsx'

const FIELDS = [
  'full_name',
  'reg_number',
  'gender',
  'phone',
  'campus_id',
  'department_id',
  'programme_id',
  'level_id',
  'grad_year',
  'hub_id',
]
// Not asked: the cluster comes from the hub, in the database (fill_profile_links).

const toOptions = (rows) => rows.map((r) => ({ value: r.id, label: r.name }))

// The student's details. Used by the student (mode 'student': can choose the
// hub, ticks support) and by staff (mode 'staff': hub is fixed here, because
// only an admin moves students, from a separate control).
// `side(form)` (optional) fills a column on the right that follows what is typed.
export function ProfileForm({ mode = 'student', profile, lists, support = [], isMentor, onSaved, onCancel, side }) {
  const staff = mode === 'staff'
  const H = staff ? 'h3' : 'h2'
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((k) => [k, profile[k] == null ? '' : String(profile[k])])),
  )
  const [ticked, setTicked] = useState(() => new Set(support))
  const [savedSupport, setSavedSupport] = useState(() => new Set(support))
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null) // { kind, text }
  const [busy, setBusy] = useState(false)

  // Every programme, with its department beside it, so one search finds it.
  const programmeOptions = lists.programmes
    .map((p) => ({ value: p.id, label: p.name, meta: nameOf(lists.departments, p.department_id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const hubOptions = lists.hubs.map((h) => ({ value: h.id, label: h.name, meta: nameOf(lists.clusters, h.cluster_id) }))

  function set(key, value) {
    setResult(null)
    setForm((f) => {
      const next = { ...f, [key]: value }
      // The programme decides the department.
      if (key === 'programme_id' && value) {
        next.department_id = lists.programmes.find((p) => p.id === value)?.department_id ?? f.department_id
      }
      return next
    })
  }
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key, e.target.value), error: errors[key] })

  function tick(id, on) {
    setResult(null)
    setTicked((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function submit(e) {
    e.preventDefault()
    const next = {
      full_name: checkFullName(form.full_name),
      reg_number: checkRegNumber(form.reg_number),
      phone: checkPhone(form.phone),
      grad_year: checkGradYear(form.grad_year),
    }
    setErrors(next)
    setResult(null)
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const patch = Object.fromEntries(FIELDS.map((k) => [k, form[k] === '' ? null : form[k]]))
    patch.full_name = form.full_name.trim().replace(/\s+/g, ' ')
    patch.reg_number = cleanRegNumber(form.reg_number) || null
    patch.phone = cleanPhone(form.phone) || null
    patch.grad_year = form.grad_year.trim() ? Number(form.grad_year) : null
    if (staff) delete patch.hub_id

    setBusy(true)
    try {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select('id')
      if (error) throw error
      if (!data.length) throw { code: '42501' }

      if (!staff) {
        const add = [...ticked].filter((id) => !savedSupport.has(id))
        const remove = [...savedSupport].filter((id) => !ticked.has(id))
        if (remove.length) {
          const r = await supabase
            .from('student_support')
            .delete()
            .eq('student_id', profile.id)
            .in('support_type_id', remove)
          if (r.error) throw r.error
        }
        if (add.length) {
          const r = await supabase
            .from('student_support')
            .insert(add.map((support_type_id) => ({ student_id: profile.id, support_type_id })))
          if (r.error) throw r.error
        }
        setSavedSupport(new Set(ticked))
      }
      setForm((f) => ({ ...f, full_name: patch.full_name, reg_number: patch.reg_number ?? '', phone: patch.phone ?? '' }))
      setResult({ kind: 'ok', text: staff ? 'Saved.' : 'Profile saved.' })
      onSaved?.(patch)
    } catch (error) {
      if (error.code === '23505' && /reg_number/.test(error.message)) {
        setErrors({ reg_number: MSG.regTaken })
        document.getElementById('reg_number')?.focus()
      } else if (error.code === '23503' && /programme/.test(error.message)) {
        setErrors({ programme_id: MSG.wrongProgramme })
        document.getElementById('programme_id')?.focus()
      } else {
        setResult({ kind: 'error', text: errorMessage(error) })
      }
    } finally {
      setBusy(false)
    }
  }

  const body = (
    <form onSubmit={submit} noValidate className="form">
      <section className="form-section">
        <H>About you</H>
        <Field id="full_name" label="Full name" hint="As on your CBE registration." autoComplete={staff ? 'off' : 'name'} {...bind('full_name')} />
        <Field
          id="reg_number"
          label="Registration number"
          hint="Like 03.12345.01.01.2026"
          inputMode="decimal"
          {...bind('reg_number')}
        />
        <SelectField id="gender" label="Gender" options={GENDERS} {...bind('gender')} />
        <Field
          id="phone"
          label="Phone number"
          type="tel"
          autoComplete={staff ? 'off' : 'tel'}
          {...bind('phone')}
        />
        <Field
          id="email"
          label="Email"
          hint="Can't be changed here."
          value={profile.email}
          readOnly
          className="read-only"
        />
      </section>

      <section className="form-section">
        <H>Your studies</H>
        <SelectField id="campus_id" label="Campus" options={toOptions(lists.campuses)} {...bind('campus_id')} />
        <SearchSelect
          id="programme_id"
          label="Programme (course)"
          hint="Type to search. Not listed? Leave it empty."
          options={programmeOptions}
          {...bind('programme_id')}
        />
        {form.programme_id ? (
          <p className="filled-in">
            <span className="filled-in-label">Department</span> {nameOf(lists.departments, form.department_id)}
          </p>
        ) : (
          <SelectField
            id="department_id"
            label="Department"
            hint="Only if your programme isn't listed."
            options={toOptions(lists.departments)}
            {...bind('department_id')}
          />
        )}
        <SelectField id="level_id" label="Level of study" options={toOptions(lists.levels)} {...bind('level_id')} />
        <Field id="grad_year" label="Expected graduation year" inputMode="numeric" maxLength={4} {...bind('grad_year')} />
      </section>

      <section className="form-section">
        <H>Your hub</H>
        <SearchSelect
          id="hub_id"
          label="Innovation hub"
          hint={
            staff
              ? isMentor
                ? 'Only an admin can move a student to another hub.'
                : undefined
              : 'Type to search. Your mentor comes from your hub.'
          }
          options={hubOptions}
          disabled={staff}
          {...bind('hub_id')}
        />
      </section>

      {!staff && (
        <section className="form-section">
          <H>Support you want</H>
          <fieldset className="choice-group">
            <legend>Pick all that would help.</legend>
            {lists.supportTypes.map((t) => (
              <Checkbox key={t.id} label={t.name} checked={ticked.has(t.id)} onChange={(on) => tick(t.id, on)} />
            ))}
          </fieldset>
        </section>
      )}

      {result && <Notice kind={result.kind}>{result.text}</Notice>}
      <div className="actions">
        <Button type="submit" busy={busy} busyLabel={MSG.saving}>
          {staff ? 'Save' : 'Save profile'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )

  if (!side) return body
  return (
    <div className="profile-layout">
      {body}
      <aside className="profile-side">{side(form)}</aside>
    </div>
  )
}
