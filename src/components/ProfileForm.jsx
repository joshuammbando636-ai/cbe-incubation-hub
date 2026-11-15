import { useState } from 'react'
import { GENDERS } from '../lib/labels.js'
import { checkGradYear, checkPhone, checkRegNumber, cleanPhone, cleanRegNumber } from '../lib/student.js'
import { supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'
import { checkRequired, firstError } from '../lib/validate.js'
import { Button, Checkbox, Field, Notice, SelectField } from './ui.jsx'

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
  'cluster_id',
  'hub_id',
]

const toOptions = (rows) => rows.map((r) => ({ value: r.id, label: r.name }))

// The student's details. Used by the student (mode 'student': can choose the
// hub, ticks support) and by staff (mode 'staff': hub is fixed here, because
// only an admin moves students, from a separate control).
export function ProfileForm({ mode = 'student', profile, lists, support = [], isMentor, onSaved, onCancel }) {
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

  const programmes = lists.programmes.filter((p) => p.department_id === form.department_id)

  function set(key, value) {
    setResult(null)
    setForm((f) => {
      const next = { ...f, [key]: value }
      // A programme only fits its own department.
      if (key === 'department_id' && !lists.programmes.some((p) => p.id === f.programme_id && p.department_id === value)) {
        next.programme_id = ''
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
      full_name: checkRequired(form.full_name, 'full name'),
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

  return (
    <form onSubmit={submit} noValidate className="form">
      <section className="form-section">
        <H>About you</H>
        <Field id="full_name" label="Full name" autoComplete={staff ? 'off' : 'name'} {...bind('full_name')} />
        <Field
          id="reg_number"
          label="Registration number"
          hint="As on your student ID, like 03.12345.01.01.2026."
          inputMode="decimal"
          {...bind('reg_number')}
        />
        <SelectField id="gender" label="Gender" options={GENDERS} {...bind('gender')} />
        <Field
          id="phone"
          label="Phone number"
          hint="A number we can reach you on."
          type="tel"
          autoComplete={staff ? 'off' : 'tel'}
          {...bind('phone')}
        />
        <Field
          id="email"
          label="Email"
          hint="You cannot change your email here."
          value={profile.email}
          readOnly
          className="read-only"
        />
      </section>

      <section className="form-section">
        <H>Your studies</H>
        <SelectField id="campus_id" label="Campus" options={toOptions(lists.campuses)} {...bind('campus_id')} />
        <SelectField id="department_id" label="Department" options={toOptions(lists.departments)} {...bind('department_id')} />
        <SelectField
          id="programme_id"
          label="Programme"
          hint="Not on the list? Leave it empty and tell your mentor."
          options={toOptions(programmes)}
          placeholder={form.department_id ? 'Choose…' : 'Choose a department first'}
          disabled={!form.department_id}
          {...bind('programme_id')}
        />
        <SelectField id="level_id" label="Level of study" options={toOptions(lists.levels)} {...bind('level_id')} />
        <Field id="grad_year" label="Expected graduation year" inputMode="numeric" maxLength={4} {...bind('grad_year')} />
      </section>

      <section className="form-section">
        <H>Your hub</H>
        <SelectField id="cluster_id" label="Cluster" options={toOptions(lists.clusters)} {...bind('cluster_id')} />
        <SelectField
          id="hub_id"
          label="Innovation hub"
          hint={
            staff
              ? isMentor
                ? 'Only an admin can move a student to another hub.'
                : undefined
              : 'Choose one hub. Your mentor comes from this hub.'
          }
          options={toOptions(lists.hubs)}
          disabled={staff}
          {...bind('hub_id')}
        />
      </section>

      {!staff && (
        <section className="form-section">
          <H>Support you want</H>
          <fieldset className="choice-group">
            <legend>Tick everything that would help you.</legend>
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
}
