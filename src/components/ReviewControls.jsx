import { useState } from 'react'
import { stageIndex, stageLabel } from '../lib/labels.js'
import { supabase } from '../lib/supabase.js'
import { errorMessage, required } from '../lib/text.js'
import { Button, Field, Notice } from './ui.jsx'

// Verify / do-not-accept for one waiting video.
// video: a progress_updates row; currentStage: the idea's stage now.
// onReviewed(updatedRow) is called after the database accepts the change.
export function ReviewControls({ video, currentStage, studentName, onReviewed }) {
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState('')
  const id = `feedback-${video.id}`
  const notAbove = stageIndex(video.stage) <= stageIndex(currentStage)

  async function review(status) {
    setResult(null)
    if (status === 'rejected' && !feedback.trim()) {
      setError(required('feedback'))
      return document.getElementById(id)?.focus()
    }
    setError('')
    setBusy(status)
    const { data, error: err } = await supabase
      .from('progress_updates')
      .update({ status, feedback: feedback.trim() || null })
      .eq('id', video.id)
      .eq('status', 'pending') // someone else may have reviewed it already
      .select()
    setBusy('')
    if (err) return setResult({ kind: 'error', text: errorMessage(err) })
    if (!data.length) return setResult({ kind: 'wait', text: 'This video was already reviewed.' })
    setResult(
      status === 'verified'
        ? { kind: 'ok', text: `Verified. ${studentName} is now at ${stageLabel(video.stage)}.` }
        : { kind: 'ok', text: 'Marked as not accepted.' },
    )
    onReviewed?.(data[0])
  }

  if (result && result.kind !== 'error') return <Notice kind={result.kind}>{result.text}</Notice>

  return (
    <div className="review">
      {notAbove && (
        <Notice kind="wait">
          This video shows a stage that is not above the student's current stage. Verifying will set the stage to{' '}
          {stageLabel(video.stage)}.
        </Notice>
      )}
      {result && <Notice kind="error">{result.text}</Notice>}
      <Field
        id={id}
        label="Feedback for the student"
        hint="Needed if you do not accept the video."
        multiline
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        error={error}
      />
      <div className="actions">
        <Button type="button" busy={busy === 'verified'} disabled={Boolean(busy)} onClick={() => review('verified')}>
          Verify and move to {stageLabel(video.stage)}
        </Button>
        <Button type="button" variant="secondary" busy={busy === 'rejected'} disabled={Boolean(busy)} onClick={() => review('rejected')}>
          Do not accept
        </Button>
      </div>
    </div>
  )
}
