import { useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { Checkbox, LoadError, Notice, Spinner, VideoLink, VideoPlayer } from '../../components/ui.jsx'
import { useLoad } from '../../lib/data.js'
import { countDone } from '../../lib/student.js'
import { loadMyLessons } from '../../lib/studentData.js'
import { supabase } from '../../lib/supabase.js'
import { errorMessage } from '../../lib/text.js'
import { useTitle } from '../../lib/useTitle.js'

export function Lessons() {
  useTitle('Lessons')
  const { profile } = useAuth()
  const page = useLoad(() => loadMyLessons(profile.id), [profile.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return <LessonList userId={profile.id} lessons={page.data.lessons} initialDone={page.data.done} />
}

function LessonList({ userId, lessons, initialDone }) {
  const [done, setDone] = useState(initialDone)
  const [problem, setProblem] = useState('')

  async function toggle(id, on) {
    setProblem('')
    const flip = (value) =>
      setDone((s) => {
        const next = new Set(s)
        if (value) next.add(id)
        else next.delete(id)
        return next
      })
    flip(on)
    const { error } = on
      ? await supabase.from('lesson_progress').insert({ lesson_id: id, student_id: userId })
      : await supabase.from('lesson_progress').delete().eq('lesson_id', id).eq('student_id', userId)
    if (error && error.code !== '23505') {
      flip(!on)
      setProblem(errorMessage(error))
    }
  }

  return (
    <div className="narrow-content">
      <h1>Lessons</h1>
      <p className="lede">Short videos from your mentors. Tick each one when you finish it.</p>

      {lessons.length === 0 ? (
        <section className="section">
          <h2>No lessons yet.</h2>
          <p>Your mentors will post lessons here.</p>
        </section>
      ) : (
        <>
          <p className="count" aria-live="polite">
            {countDone(lessons, done)} of {lessons.length} done
          </p>
          {problem && <Notice kind="error">{problem}</Notice>}
          <ul className="rows">
            {lessons.map((l) => (
              <li key={l.id} className="row lesson">
                <p className="tag">{l.hub_id ? 'For your hub' : 'For everyone'}</p>
                <h2>{l.title}</h2>
                {l.description && <p>{l.description}</p>}
                <VideoPlayer url={l.video_url} title={l.title} />
                <p>
                  <VideoLink url={l.video_url} label="Open in YouTube" />
                </p>
                <Checkbox label="Done" checked={done.has(l.id)} onChange={(on) => toggle(l.id, on)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
