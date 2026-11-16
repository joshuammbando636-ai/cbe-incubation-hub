import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import {
  Button,
  Field,
  LoadError,
  Notice,
  SelectField,
  Spinner,
  StageTracker,
  VideoLink,
} from '../../components/ui.jsx'
import { must, useLoad } from '../../lib/data.js'
import { STAGES, VIDEO_STATUS, formatDate, stageLabel, stagesAbove } from '../../lib/labels.js'
import { supabase } from '../../lib/supabase.js'
import { MSG, errorMessage, required, requiredChoice } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'
import { firstError } from '../../lib/validate.js'
import { isYoutubeLink } from '../../lib/youtube.js'

async function loadProgress(userId) {
  const idea = must(await supabase.from('startup_ideas').select('id, stage').eq('owner_id', userId).maybeSingle())
  if (!idea) return { idea: null, videos: [] }
  const videos = must(
    await supabase.from('progress_updates').select('*').eq('idea_id', idea.id).order('created_at', { ascending: false }),
  )
  return { idea, videos }
}

export function Progress() {
  useTitle('Your progress')
  const { profile } = useAuth()
  const page = useLoad(() => loadProgress(profile.id), [profile.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { idea, videos } = page.data
  if (!idea) {
    return (
      <div className="narrow-content">
        <h1>Your progress</h1>
        <StageTracker stage={null} />
        <section className="section">
          <h2>Add your business idea first</h2>
          <p>Progress videos belong to an idea.</p>
          <p>
            <Link to="/student/idea" className="link-btn">
              Add your idea
            </Link>
          </p>
        </section>
      </div>
    )
  }
  return <ProgressBody idea={idea} initialVideos={videos} />
}

function ProgressBody({ idea, initialVideos }) {
  const [videos, setVideos] = useState(initialVideos)
  const [sentNow, setSentNow] = useState(false)
  const waiting = videos.some((v) => v.status === 'pending')
  const atTop = idea.stage === STAGES[STAGES.length - 1].value

  return (
    <div className="narrow-content">
      <h1>Your progress</h1>
      <StageTracker stage={idea.stage} />

      <section className="section">
        {sentNow && <Notice kind="ok">Sent. A mentor will review your video.</Notice>}
        {atTop ? (
          <p>You have reached the last stage. Well done.</p>
        ) : waiting ? (
          !sentNow && (
            <Notice kind="wait">Your video is waiting for a mentor. You can post another one after it is reviewed.</Notice>
          )
        ) : (
          <PostVideo
            idea={idea}
            onSent={(row) => {
              setVideos((v) => [row, ...v])
              setSentNow(true)
            }}
          />
        )}
      </section>

      <section className="section">
        <h2>Your videos</h2>
        {videos.length === 0 ? (
          <p>No videos yet.</p>
        ) : (
          <ul className="rows">
            {videos.map((v) => (
              <li key={v.id} className="row">
                <p className="row-head">
                  {stageLabel(v.stage)} · Sent {formatDate(v.created_at)} ·{' '}
                  <span className={`status status-${v.status}`}>{VIDEO_STATUS[v.status]}</span>
                </p>
                <p>
                  <VideoLink url={v.video_url} />
                </p>
                {v.note && <p className="quote">{v.note}</p>}
                {v.feedback && <p>Mentor feedback: {v.feedback}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PostVideo({ idea, onSent }) {
  const choices = stagesAbove(idea.stage)
  const [form, setForm] = useState({ stage: choices.length === 1 ? choices[0].value : '', url: '', note: '' })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const url = form.url.trim()
    const next = {
      stage: form.stage ? '' : requiredChoice('stage'),
      url: !url ? required('YouTube link') : isYoutubeLink(url) ? '' : MSG.badYoutube,
    }
    setErrors(next)
    setProblem('')
    const bad = firstError(next)
    if (bad) return document.getElementById(bad)?.focus()

    setBusy(true)
    const { data, error } = await supabase
      .from('progress_updates')
      .insert({ idea_id: idea.id, stage: form.stage, video_url: url, note: form.note.trim() || null })
      .select()
      .single()
    setBusy(false)
    if (error) return setProblem(errorMessage(error))
    onSent(data)
  }

  return (
    <>
      <h2>Post a progress video</h2>
      <p>
        Record a short video that shows your progress. Upload it to YouTube as Unlisted, then paste the link here. A
        mentor will watch it.
      </p>
      <form onSubmit={submit} noValidate className="form">
        {problem && <Notice kind="error">{problem}</Notice>}
        <SelectField
          id="stage"
          label="Which stage does the video show?"
          options={choices.map((s) => ({ value: s.value, label: s.label }))}
          value={form.stage}
          onChange={set('stage')}
          error={errors.stage}
        />
        <Field
          id="url"
          label="YouTube link"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={form.url}
          onChange={set('url')}
          error={errors.url}
        />
        <Field id="note" label="Note for your mentor (optional)" multiline value={form.note} onChange={set('note')} />
        <Button type="submit" busy={busy}>
          Send to mentor
        </Button>
      </form>
    </>
  )
}
