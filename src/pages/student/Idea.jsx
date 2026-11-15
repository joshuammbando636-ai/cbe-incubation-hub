import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { Button, Field, LoadError, Notice, RadioGroup, SelectField, Spinner } from '../../components/ui.jsx'
import { loadLists, must, useLoad } from '../../lib/data.js'
import { STAGES, stageLabel } from '../../lib/labels.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, requiredChoice } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { checkRequired, firstError } from '../../lib/validate.js'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

async function loadIdeaPage(userId) {
  const [lists, idea] = await Promise.all([
    loadLists(),
    supabase.from('startup_ideas').select('*').eq('owner_id', userId).maybeSingle().then(must),
  ])
  return { lists, idea }
}

export function Idea() {
  useTitle('Your business idea')
  const { profile } = useAuth()
  const page = useLoad(() => loadIdeaPage(profile.id), [profile.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <IdeaForm ownerId={profile.id} lists={page.data.lists} initial={page.data.idea} onConflict={page.reload} />
}

function IdeaForm({ ownerId, lists, initial, onConflict }) {
  const [idea, setIdea] = useState(initial)
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    business_name: initial?.business_name ?? '',
    sector_id: initial?.sector_id ?? '',
    owns: initial ? (initial.owns_business ? 'yes' : 'no') : '',
    stage: '',
  })
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key, value) => {
    setResult(null)
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    const next = {
      description: checkRequired(form.description, 'idea'),
      sector_id: form.sector_id ? '' : requiredChoice('business sector'),
      owns: form.owns ? '' : requiredChoice('answer'),
      stage: idea || form.stage ? '' : requiredChoice('stage'),
    }
    setErrors(next)
    setResult(null)
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    const fields = {
      description: form.description.trim(),
      business_name: form.business_name.trim() || null,
      sector_id: form.sector_id,
      owns_business: form.owns === 'yes',
    }

    setBusy(true)
    const query = idea
      ? supabase.from('startup_ideas').update(fields).eq('id', idea.id)
      : supabase.from('startup_ideas').insert({ ...fields, owner_id: ownerId, stage: form.stage })
    const { data, error } = await query.select().maybeSingle()
    setBusy(false)

    if (error?.code === '23505') return onConflict() // already added, e.g. in another tab
    if (error) return setResult({ kind: 'error', text: errorMessage(error) })
    if (!data) return setResult({ kind: 'error', text: MSG.notAllowed })
    setIdea(data)
    setResult({ kind: 'ok', text: 'Idea saved.' })
  }

  return (
    <div className="narrow-content">
      <h1>Your business idea</h1>
      {!idea && (
        <p className="lede">
          Tell us about the business or project you want to build. You can add one idea.
        </p>
      )}

      {idea && (
        <section className="stage-box">
          <p className="stage-now">
            Stage: <strong>{stageLabel(idea.stage)}</strong>
          </p>
          <p>Only a mentor can change the stage. To move up, post a progress video.</p>
          <p>
            <Link to="/student/progress">Post a progress video</Link>
          </p>
        </section>
      )}

      <form onSubmit={submit} noValidate className="form">
        <Field
          id="description"
          label="Your idea"
          hint="What will you sell or do, and for whom? Two or three sentences is enough."
          multiline
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />
        <Field
          id="business_name"
          label="Business name (optional)"
          value={form.business_name}
          onChange={(e) => set('business_name', e.target.value)}
        />
        <SelectField
          id="sector_id"
          label="Business sector"
          options={lists.sectors.map((s) => ({ value: s.id, label: s.name }))}
          value={form.sector_id}
          onChange={(e) => set('sector_id', e.target.value)}
          error={errors.sector_id}
        />
        <RadioGroup
          name="owns"
          legend="Do you already run this business?"
          options={YES_NO}
          value={form.owns}
          onChange={(v) => set('owns', v)}
          error={errors.owns}
        />
        {!idea && (
          <RadioGroup
            name="stage"
            legend="What stage is it at?"
            hint="Choose honestly. After this, only a mentor can change the stage."
            options={STAGES}
            value={form.stage}
            onChange={(v) => set('stage', v)}
            error={errors.stage}
          />
        )}

        {result && <Notice kind={result.kind}>{result.text}</Notice>}
        <Button type="submit" busy={busy} busyLabel={MSG.saving}>
          Save idea
        </Button>
      </form>
    </div>
  )
}
