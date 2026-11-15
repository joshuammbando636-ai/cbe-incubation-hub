import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { LoadError, Notice, Spinner } from '../../components/ui.jsx'
import { loadLists, must, nameOf, useLoad } from '../../lib/data.js'
import { VIDEO_STATUS, firstName, formatDate, stageLabel } from '../../lib/labels.js'
import { countDone, missingDetails, missingLabel } from '../../lib/student.js'
import { countNew, formatDateTime, readSeen } from '../../lib/notices.js'
import { loadMyLessons, loadMyNotices } from '../../lib/studentData.js'
import { supabase } from '../../lib/supabase.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadHome(userId) {
  // One trip: the idea comes with its latest video and the mentor's name.
  const [lists, profile, idea, lessons, news] = await Promise.all([
    loadLists(),
    supabase.from('profiles').select('*').eq('id', userId).single().then(must),
    supabase
      .from('startup_ideas')
      .select(
        'id, description, business_name, stage, mentor_id, mentor:profiles!mentor_id(full_name), videos:progress_updates(status, reviewed_at)',
      )
      .eq('owner_id', userId)
      .order('created_at', { referencedTable: 'videos', ascending: false })
      .limit(1, { referencedTable: 'videos' })
      .maybeSingle()
      .then(must),
    loadMyLessons(userId),
    loadMyNotices(),
  ])
  const latest = idea?.videos?.[0] ?? null
  const mentor = idea?.mentor?.full_name ?? ''
  return { lists, profile, idea, latest, mentor, lessons, news }
}

const short = (text, max = 90) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text)

export function StudentHome() {
  useTitle('Home')
  const { profile: me } = useAuth()
  const page = useLoad(() => loadHome(me.id), [me.id], `home:${me.id}`)

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { lists, profile, idea, latest, mentor, lessons, news } = page.data
  const missing = missingDetails(profile)
  const name = firstName(profile.full_name)
  const done = countDone(lessons.lessons, lessons.done)

  return (
    <div className="narrow-content">
      {profile.needs_review && (
        <Notice kind="wait" title="Please check your details">
          <p>
            {profile.review_note?.trim() ||
              'A mentor has asked you to confirm your details. Open your profile and check that everything is correct.'}
          </p>
          <p>
            <Link to="/student/profile">Open your profile</Link>
          </p>
        </Notice>
      )}

      <h1>{name ? `Hello, ${name}.` : 'Hello.'}</h1>
      <p className="lede">Here is where you stand.</p>

      <dl className="facts">
        <div>
          <dt>Hub</dt>
          <dd>{nameOf(lists.hubs, profile.hub_id) || 'Not chosen yet'}</dd>
        </div>
        <div>
          <dt>Mentor</dt>
          <dd>{mentor || 'Not assigned yet'}</dd>
        </div>
      </dl>

      <ol className="steps-list">
        <Step
          title="Your profile"
          status={missing === 0 ? 'Complete' : missingLabel(missing)}
          tone={missing === 0 ? 'ok' : 'wait'}
          link={missing === 0 ? ['/student/profile', 'View profile'] : ['/student/profile', 'Complete your profile']}
        />

        {idea ? (
          <Step
            title="Your business idea"
            status={stageLabel(idea.stage)}
            tone="ok"
            line={idea.business_name || short(idea.description)}
            link={['/student/idea', 'View idea']}
          />
        ) : (
          <Step
            title="Your business idea"
            status="Not added yet"
            line="No idea yet? Add it when you have one."
            link={['/student/idea', 'Add your idea']}
          />
        )}

        <ProgressStep idea={idea} latest={latest} />

        <Step
          title="Lessons"
          status={lessons.lessons.length ? `${done} of ${lessons.lessons.length} done` : 'No lessons yet'}
          tone={lessons.lessons.length && done === lessons.lessons.length ? 'ok' : undefined}
          link={lessons.lessons.length ? ['/student/lessons', 'Open lessons'] : null}
        />

        <NoticesStep news={news} userId={me.id} />
      </ol>
    </div>
  )
}

function NoticesStep({ news, userId }) {
  const fresh = countNew(news.notices, readSeen(userId))
  const next = news.meetings[0]
  return (
    <Step
      title="Meetings and notices"
      status={fresh ? `${fresh} new` : null}
      tone={fresh ? 'wait' : undefined}
      line={next ? `Next meeting: ${next.title}, ${formatDateTime(next.starts_at)}.` : 'No meetings coming up.'}
      link={['/student/notices', 'Open notices']}
    />
  )
}

function ProgressStep({ idea, latest }) {
  const title = 'Your progress'
  if (!idea) return <Step title={title} status="Add your idea first" />
  const link = ['/student/progress', 'Open progress']
  if (!latest) return <Step title={title} line="Post a short video to move up a stage." link={['/student/progress', 'Post a video']} />
  if (latest.status === 'pending') {
    return <Step title={title} status={VIDEO_STATUS.pending} tone="wait" line="A mentor will watch your video." link={link} />
  }
  if (latest.status === 'verified') {
    return (
      <Step
        title={title}
        status={VIDEO_STATUS.verified}
        tone="ok"
        line={`Last video verified on ${formatDate(latest.reviewed_at)}.`}
        link={link}
      />
    )
  }
  return (
    <Step title={title} status={VIDEO_STATUS.rejected} tone="error" line="Read the feedback and try again." link={link} />
  )
}

// tone: 'ok' | 'wait' | 'error' → a small coloured dot before the status.
function Step({ title, status, tone, line, link }) {
  return (
    <li className="step">
      <div className="step-head">
        <h2>{title}</h2>
        {status && <p className={`status${tone ? ` status-${tone}` : ''}`}>{status}</p>}
      </div>
      {line && <p className="step-line">{line}</p>}
      {link && (
        <p>
          <Link to={link[0]}>{link[1]}</Link>
        </p>
      )}
    </li>
  )
}
