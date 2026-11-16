import {
  BookOpen,
  CalendarDays,
  Check,
  Ellipsis,
  Info,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Plus,
  TrendingUp,
  User,
} from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { Avatar } from '../../components/Avatar.jsx'
import { LoadError, Notice, Spinner } from '../../components/ui.jsx'
import { loadLists, must, nameOf, useLoad } from '../../lib/data.js'
import { STAGES, VIDEO_STATUS, firstName, formatDate, stageIndex, stageLabel } from '../../lib/labels.js'
import { countDone, missingDetails, missingLabel, nextStep } from '../../lib/student.js'
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

const short = (text, max = 110) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text)

// Student dashboard (Josh's "Drive" reference): the name with a blue square
// button, four "Quick access" folder cards, then one row per area like a file list.
export function StudentHome() {
  useTitle('Dashboard')
  const { profile: me } = useAuth()
  const page = useLoad(() => loadHome(me.id), [me.id], `home:${me.id}`)

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { lists, profile, idea, latest, mentor, lessons, news } = page.data
  const missing = missingDetails(profile)
  const name = firstName(profile.full_name)
  const total = lessons.lessons.length
  const done = countDone(lessons.lessons, lessons.done)
  const fresh = countNew(news.notices, readSeen(me.id))
  const stageAt = idea ? stageIndex(idea.stage) : -1
  const hub = nameOf(lists.hubs, profile.hub_id)
  const meeting = news.meetings[0]
  const next = nextStep({
    missing,
    idea,
    latest,
    lessonsLeft: total - done,
    lastStage: stageAt === STAGES.length - 1,
  })
  // The four steps every student goes through, for the dots on the blue card.
  const steps = [
    { label: 'Profile', done: missing === 0 },
    { label: 'Idea', done: Boolean(idea) },
    { label: 'Video', done: latest?.status === 'verified' },
    { label: 'Lessons', done: total > 0 && done === total },
  ]

  return (
    <>
      {profile.needs_review && (
        <Notice kind="wait" title="Please check your details">
          <p>
            {profile.review_note?.trim() ||
              'A mentor has asked you to confirm your details. Open your profile and check that everything is correct.'}
          </p>
          <p>
            <Link to="/student/profile" className="link-btn">
              Open your profile
            </Link>
          </p>
        </Notice>
      )}

      <div className="drive-head">
        <div className="drive-head-text">
          <h1>{name ? `Hi, ${name}` : 'Hi there'}</h1>
          <p>{hub ? `${hub}${mentor ? ` · Mentor: ${mentor}` : ''}` : 'Choose your hub on your profile.'}</p>
        </div>
        <Link to="/student/progress" className="square-btn" aria-label="Post an update" title="Post an update">
          <Plus aria-hidden="true" size={20} strokeWidth={2.25} />
        </Link>
        <div className="drive-head-end">
          <Link
            to="/student/notices"
            className="square-btn square-btn--light"
            aria-label="Meetings and notices"
            title="Meetings and notices"
          >
            <CalendarDays aria-hidden="true" size={19} strokeWidth={1.75} />
          </Link>
          <Link to="/student/profile" className="square-btn square-btn--light" aria-label="Your details" title="Your details">
            <Info aria-hidden="true" size={19} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <h2 className="drive-h2">Quick access</h2>
      <ul className="quick">
        <li className="folder is-main">
          <p className="folder-label">{next ? 'Next step' : 'All done'}</p>
          <Dots items={steps.map((s, i) => ({ key: s.label, on: s.done, text: i + 1, title: s.label }))} />
          <div className="folder-foot">
            <p className="folder-kind">{next ? next.action : 'Up to date'}</p>
            <Link to={next?.to ?? '/student/progress'} className="folder-name">
              {next ? next.title : 'Nothing is waiting on you'}
            </Link>
          </div>
        </li>

        <li className="folder">
          <p className="folder-label">{idea ? `Stage ${stageAt + 1} of ${STAGES.length}` : 'No idea yet'}</p>
          <Dots items={STAGES.map((s, i) => ({ key: s.value, on: i <= stageAt, text: i + 1, title: s.label }))} />
          <div className="folder-foot">
            <p className="folder-kind">{idea ? stageLabel(idea.stage) : 'My idea'}</p>
            <Link to="/student/idea" className="folder-name">
              {idea ? idea.business_name || 'Your business idea' : 'Add your idea'}
            </Link>
          </div>
        </li>

        <li className="folder">
          <p className="folder-label">{total ? `${done} of ${total} done` : 'No lessons yet'}</p>
          <Dots
            items={lessons.lessons.slice(0, 4).map((l, i) => ({
              key: l.id,
              on: lessons.done.has(l.id),
              text: i === 3 && total > 4 ? `+${total - 3}` : i + 1,
              title: l.title,
            }))}
          />
          <div className="folder-foot">
            <p className="folder-kind">Lessons</p>
            <Link to="/student/lessons" className="folder-name">
              {total && done === total ? 'All lessons done' : 'Open lessons'}
            </Link>
          </div>
        </li>

        <li className="folder is-note">
          <div className="note-head">
            <div className="note-title">
              <MessageCircle aria-hidden="true" size={18} strokeWidth={1.75} />
              <Link to="/student/messages" className="folder-name">
                {mentor ? `Your mentor, ${mentor}` : 'No mentor yet. Write to your hub.'}
              </Link>
            </div>
            {mentor && <Avatar name={mentor} />}
          </div>
          <div className="folder-foot">
            <p className="folder-kind">Next meeting</p>
            <p className="note-when">{meeting ? formatDateTime(meeting.starts_at) : 'None planned yet'}</p>
          </div>
        </li>
      </ul>

      <h2 className="drive-h2">All your work</h2>
      <div className="files-head" aria-hidden="true">
        <span>Name</span>
        <span>Status</span>
        <span>Details</span>
        <span />
      </div>
      <ul className="files">
        <File
          icon={Lightbulb}
          title="Your business idea"
          to="/student/idea"
          line={idea ? idea.business_name || short(idea.description) : 'No idea yet? Add it when you have one.'}
          status={idea ? stageLabel(idea.stage) : 'Not added yet'}
          tone={idea ? 'ok' : undefined}
        />
        <ProgressFile idea={idea} latest={latest} />
        <File
          icon={BookOpen}
          title="Lessons"
          to="/student/lessons"
          line={total ? `${done} of ${total} lessons done.` : 'Your mentor has not posted lessons yet.'}
          status={total && done === total ? 'All done' : null}
          tone="ok"
        />
        <File
          icon={Megaphone}
          title="Meetings and notices"
          to="/student/notices"
          line={meeting ? `Next meeting: ${meeting.title}, ${formatDateTime(meeting.starts_at)}.` : 'No meetings coming up.'}
          status={fresh ? `${fresh} new` : null}
          tone="wait"
        />
        <File
          icon={User}
          title="Your profile"
          to="/student/profile"
          line={missing === 0 ? 'All your details are filled in.' : 'CBE needs these details for the register.'}
          status={missing === 0 ? 'Complete' : missingLabel(missing)}
          tone={missing === 0 ? 'ok' : 'wait'}
        />
      </ul>
    </>
  )
}

// Round markers on a folder card (steps, stages, lessons): filled when done.
function Dots({ items }) {
  if (items.length === 0) return null
  return (
    <ul className="folder-dots">
      {items.map((d) => (
        <li key={d.key} className={`folder-dot${d.on ? '' : ' is-off'}`} title={d.title}>
          {d.on ? <Check aria-hidden="true" size={15} strokeWidth={2.5} /> : <span aria-hidden="true">{d.text}</span>}
          <span className="visually-hidden">
            {d.title}: {d.on ? 'done' : 'not yet'}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ProgressFile({ idea, latest }) {
  const base = { icon: TrendingUp, title: 'Your progress', to: '/student/progress' }
  if (!idea) return <File {...base} line="Add your idea first, then post short videos." />
  if (!latest) return <File {...base} line="Post a short video to move up a stage." />
  if (latest.status === 'pending') return <File {...base} line="A mentor will watch your video." status={VIDEO_STATUS.pending} tone="wait" />
  if (latest.status === 'verified') {
    return (
      <File
        {...base}
        line={`Last video verified on ${formatDate(latest.reviewed_at)}.`}
        status={VIDEO_STATUS.verified}
        tone="ok"
      />
    )
  }
  return <File {...base} line="Read the feedback and try again." status={VIDEO_STATUS.rejected} tone="error" />
}

// One area of the student's work, laid out like a row in a file list.
// The whole row is the link.
function File({ icon: Icon, title, to, line, status, tone }) {
  return (
    <li className="file">
      <div className="file-name">
        <span className="file-icon" aria-hidden="true">
          <Icon size={15} strokeWidth={2} />
        </span>
        <div className="file-text">
          <Link to={to} className="file-link">
            {title}
          </Link>
          <p className="file-sub">{line}</p>
        </div>
      </div>
      {status ? <p className={`status${tone ? ` status-${tone}` : ''}`}>{status}</p> : <span />}
      <p className="file-detail">{line}</p>
      <Ellipsis className="file-more" aria-hidden="true" size={18} />
    </li>
  )
}
