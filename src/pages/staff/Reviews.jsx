import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ReviewControls } from '../../components/ReviewControls.jsx'
import { LoadError, Spinner, VideoLink, VideoPlayer } from '../../components/ui.jsx'
import { loadLists, nameOf, useLoad } from '../../lib/data.js'
import { VIDEO_STATUS, formatDate, stageLabel } from '../../lib/labels.js'
import { loadReviews } from '../../lib/staffData.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadPage() {
  const [lists, waiting] = await Promise.all([loadLists(), loadReviews('pending')])
  return { lists, waiting }
}

export function Reviews() {
  useTitle('Videos to review')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'reviewed' ? 'reviewed' : 'waiting'
  const page = useLoad(loadPage, [])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  return (
    <>
      <h1>Videos to review</h1>
      <div className="tabs">
        <button
          type="button"
          aria-pressed={tab === 'waiting'}
          onClick={() => setParams({}, { replace: true })}
        >
          Waiting ({page.data.waiting.filter((v) => v.status === 'pending').length})
        </button>
        <button
          type="button"
          aria-pressed={tab === 'reviewed'}
          onClick={() => setParams({ tab: 'reviewed' }, { replace: true })}
        >
          Reviewed
        </button>
      </div>

      {tab === 'waiting' ? (
        <Waiting key="waiting" initial={page.data.waiting} lists={page.data.lists} />
      ) : (
        <Reviewed lists={page.data.lists} />
      )}
    </>
  )
}

function Waiting({ initial, lists }) {
  const [videos, setVideos] = useState(initial)

  if (videos.length === 0) {
    return (
      <section className="section">
        <h2>Nothing to review.</h2>
        <p>New videos from your students will show up here.</p>
      </section>
    )
  }

  return (
    <ul className="rows">
      {videos.map((v) => (
        <li key={v.id} className="row">
          <p className="row-head">
            <Link to={`/staff/students/${v.student.id}`}>{v.student.full_name}</Link>
          </p>
          <p className="row-meta">
            {[nameOf(lists.hubs, v.student.hub_id), `Now: ${stageLabel(v.idea.stage)}`, `Video shows: ${stageLabel(v.stage)}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <VideoPlayer url={v.video_url} title={`${v.student.full_name}: ${stageLabel(v.stage)}`} />
          <p>
            <VideoLink url={v.video_url} />
          </p>
          {v.note && <p className="quote">{v.note}</p>}
          <ReviewControls
            video={v}
            currentStage={v.idea.stage}
            studentName={v.student.full_name}
            onReviewed={(row) => setVideos((vs) => vs.map((x) => (x.id === row.id ? { ...x, ...row } : x)))}
          />
        </li>
      ))}
    </ul>
  )
}

function Reviewed({ lists }) {
  const page = useLoad(() => loadReviews('reviewed'), [])
  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  if (page.data.length === 0) return <p className="section">No videos yet.</p>

  return (
    <ul className="rows">
      {page.data.map((v) => (
        <li key={v.id} className="row">
          <p className="row-head">
            <Link to={`/staff/students/${v.student.id}`}>{v.student.full_name}</Link> ·{' '}
            <span className={`status status-${v.status}`}>{VIDEO_STATUS[v.status]}</span>
          </p>
          <p className="row-meta">
            {[nameOf(lists.hubs, v.student.hub_id), stageLabel(v.stage), formatDate(v.reviewed_at)].filter(Boolean).join(' · ')}
          </p>
          <p>
            <VideoLink url={v.video_url} />
          </p>
          {v.feedback && <p>Mentor feedback: {v.feedback}</p>}
        </li>
      ))}
    </ul>
  )
}
