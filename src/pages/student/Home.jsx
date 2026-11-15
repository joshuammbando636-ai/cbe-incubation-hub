import { ArrowRight, BookOpen, ChevronRight, Lightbulb, Megaphone, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { LoadError, Notice, Spinner } from '../../components/ui.jsx'
import { loadLists, must, nameOf, useLoad } from '../../lib/data.js'
import { STAGES, VIDEO_STATUS, firstName, formatDate, stageIndex, stageLabel } from '../../lib/labels.js'
import { PROFILE_DETAILS, countDone, missingDetails, missingLabel, nextStep } from '../../lib/student.js'
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

// Banner drawing (Josh's pick, converted to WebP on 16 Nov). Other drawings in
// public/dashboard: idea-bulb, idea-carry, thinking, planning, spark. If the
// file is missing the banner simply has no picture.
const HERO_ART = '/dashboard/vision.webp'

// Student dashboard (Pitch.io layout): a welcome banner with the next step,
// four overview tiles, then one row per area.
export function StudentHome() {
  useTitle('Dashboard')
  const { profile: me } = useAuth()
  const page = useLoad(() => loadHome(me.id), [me.id], `home:${me.id}`)
  const [art, setArt] = useState(true)

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { lists, profile, idea, latest, mentor, lessons, news } = page.data
  const missing = missingDetails(profile)
  const name = firstName(profile.full_name)
  const total = lessons.lessons.length
  const done = countDone(lessons.lessons, lessons.done)
  const fresh = countNew(news.notices, readSeen(me.id))
  const stageAt = idea ? stageIndex(idea.stage) : -1
  const complete = Math.round(((PROFILE_DETAILS.length - missing) / PROFILE_DETAILS.length) * 100)
  const next = nextStep({
    missing,
    idea,
    latest,
    lessonsLeft: total - done,
    lastStage: stageAt === STAGES.length - 1,
  })

  return (
    <>
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

      <section className={`hero${art ? ' has-art' : ''}`}>
        <div className="hero-text">
          <h1>{name ? `Hi, ${name}` : 'Hi there'}</h1>
          <p>{next ? `Next step: ${next.title.toLowerCase()}.` : 'You are up to date. Nothing is waiting on you.'}</p>
          <ul className="hero-facts">
            <li>
              <span>Hub</span> {nameOf(lists.hubs, profile.hub_id) || 'Not chosen yet'}
            </li>
            <li>
              <span>Mentor</span> {mentor || 'Not assigned yet'}
            </li>
          </ul>
          {next && (
            <Link to={next.to} className="btn btn-primary hero-button">
              {next.action} <ArrowRight aria-hidden="true" size={18} />
            </Link>
          )}
        </div>
        {art && <img className="hero-art" src={HERO_ART} alt="" onError={() => setArt(false)} />}
      </section>

      <h2 className="overview-title">Overview</h2>
      <ul className="tiles">
        <Tile
          tone="light"
          icon={TrendingUp}
          value={idea ? `${stageAt + 1} of ${STAGES.length}` : '–'}
          label={idea ? stageLabel(idea.stage) : 'Stage'}
          to="/student/progress"
        />
        <Tile tone="solid" icon={User} value={`${complete}%`} label="Profile complete" to="/student/profile" />
        <Tile
          tone="bright"
          icon={BookOpen}
          value={total ? `${done}/${total}` : '0'}
          label="Lessons done"
          to="/student/lessons"
        />
        <Tile tone="soft" icon={Megaphone} value={String(fresh)} label="New notices" to="/student/notices" />
      </ul>

      <ul className="items">
        <Row
          icon={Lightbulb}
          title="Your business idea"
          to="/student/idea"
          line={idea ? idea.business_name || short(idea.description) : 'No idea yet? Add it when you have one.'}
          status={idea ? stageLabel(idea.stage) : 'Not added yet'}
          tone={idea ? 'ok' : undefined}
        />
        <ProgressRow idea={idea} latest={latest} />
        <Row
          icon={BookOpen}
          title="Lessons"
          to="/student/lessons"
          line={total ? `${done} of ${total} lessons done.` : 'Your mentor has not posted lessons yet.'}
          status={total && done === total ? 'All done' : null}
          tone="ok"
        />
        <Row
          icon={Megaphone}
          title="Meetings and notices"
          to="/student/notices"
          line={
            news.meetings[0]
              ? `Next meeting: ${news.meetings[0].title}, ${formatDateTime(news.meetings[0].starts_at)}.`
              : 'No meetings coming up.'
          }
          status={fresh ? `${fresh} new` : null}
          tone="wait"
        />
        <Row
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

function ProgressRow({ idea, latest }) {
  const base = { icon: TrendingUp, title: 'Your progress', to: '/student/progress' }
  if (!idea) return <Row {...base} line="Add your idea first, then post short videos." />
  if (!latest) return <Row {...base} line="Post a short video to move up a stage." />
  if (latest.status === 'pending') return <Row {...base} line="A mentor will watch your video." status={VIDEO_STATUS.pending} tone="wait" />
  if (latest.status === 'verified') {
    return (
      <Row
        {...base}
        line={`Last video verified on ${formatDate(latest.reviewed_at)}.`}
        status={VIDEO_STATUS.verified}
        tone="ok"
      />
    )
  }
  return <Row {...base} line="Read the feedback and try again." status={VIDEO_STATUS.rejected} tone="error" />
}

// tone: light | solid | bright | soft → shades of the CBE blue.
function Tile({ tone, icon: Icon, value, label, to }) {
  return (
    <li className={`tile tile-${tone}`}>
      <span className="tile-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <Link to={to} className="tile-link">
        <span className="tile-value">{value}</span>
        <span className="tile-label">{label}</span>
      </Link>
    </li>
  )
}

// One area of the student's work. The whole row is the link.
function Row({ icon: Icon, title, to, line, status, tone }) {
  return (
    <li className="item">
      <span className="item-thumb" aria-hidden="true">
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div className="item-text">
        <Link to={to} className="item-title">
          {title}
        </Link>
        <p>{line}</p>
      </div>
      {status && <p className={`status${tone ? ` status-${tone}` : ''}`}>{status}</p>}
      <ChevronRight className="item-arrow" aria-hidden="true" size={20} />
    </li>
  )
}
