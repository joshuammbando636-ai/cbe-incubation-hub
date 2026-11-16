import { CalendarDays, CircleCheck, ClipboardCheck, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { Avatar } from '../../components/Avatar.jsx'
import { LoadError, Spinner } from '../../components/ui.jsx'
import { useLoad } from '../../lib/data.js'
import { ROLE_TITLE, staffGreeting } from '../../lib/greeting.js'
import { NO_IDEA, studentCount, summarize } from '../../lib/staff.js'
import { loadStaffPage, staffPageKey } from '../../lib/staffData.js'
import { useTitle } from '../../lib/useTitle.js'

export function NoHubs() {
  return (
    <section>
      <h2>No hubs assigned yet</h2>
      <p>Ask an admin to assign your hubs. Until then you will not see any students.</p>
    </section>
  )
}

export function Overview() {
  useTitle('Overview')
  const { profile } = useAuth()
  const page = useLoad(() => loadStaffPage(profile), [profile.id], staffPageKey(profile))
  const [now] = useState(() => new Date())

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { isAdmin, hubs, rows, lists } = page.data
  if (!isAdmin && hubs.length === 0) {
    return (
      <>
        <h1>Overview</h1>
        <NoHubs />
      </>
    )
  }

  const s = summarize(rows, hubs, lists.campuses)
  const most = Math.max(1, ...s.byStage.map((g) => g.students))
  const waitingRows = rows.filter((r) => r.waiting > 0)
  return (
    <>
      <div className="drive-head">
        <div className="drive-head-text">
          <p className="drive-head-kicker">
            {ROLE_TITLE[profile.role]} · {isAdmin ? 'All hubs' : hubs.map((h) => h.name).join(', ')}
          </p>
          <h1>{staffGreeting(profile, now)}</h1>
        </div>
        <Link to="/staff/reviews" className="square-btn" aria-label="Review videos" title="Review videos">
          <CircleCheck aria-hidden="true" size={20} strokeWidth={2} />
        </Link>
        <div className="drive-head-end">
          <Link to="/staff/students" className="square-btn square-btn--light" aria-label="All students" title="All students">
            <LayoutGrid aria-hidden="true" size={19} strokeWidth={1.75} />
          </Link>
          <Link to="/staff/meetings" className="square-btn square-btn--light" aria-label="Meetings" title="Meetings">
            <CalendarDays aria-hidden="true" size={19} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <h2 className="drive-h2">Quick access</h2>
      <ul className="quick">
        <li className="folder is-main">
          <p className="folder-label">{isAdmin ? 'Every student' : 'Your students'}</p>
          <People rows={rows} total={s.students} />
          <div className="folder-foot">
            <p className="folder-kind">Students</p>
            <Link to="/staff/students" className="folder-name">
              {studentCount(s.students)}
            </Link>
          </div>
        </li>

        <li className="folder">
          <p className="folder-label">Videos waiting</p>
          <People rows={waitingRows} total={waitingRows.length} />
          <div className="folder-foot">
            <p className="folder-kind">Reviews</p>
            <Link to="/staff/reviews" className="folder-name">
              {s.waiting === 0 ? 'Nothing to review' : s.waiting === 1 ? '1 video to review' : `${s.waiting} videos to review`}
            </Link>
          </div>
        </li>

        <li className="folder">
          <p className="folder-label">With an idea</p>
          <ul className="folder-dots">
            {s.byStage
              .filter((g) => g.value !== NO_IDEA)
              .map((g) => (
                <li key={g.value} className={`folder-dot${g.students ? '' : ' is-off'}`} title={g.label}>
                  <span aria-hidden="true">{g.students}</span>
                  <span className="visually-hidden">
                    {g.label}: {g.students}
                  </span>
                </li>
              ))}
          </ul>
          <div className="folder-foot">
            <p className="folder-kind">Ideas</p>
            <Link to="/staff/students" className="folder-name">
              {s.withIdea} of {studentCount(s.students)}
            </Link>
          </div>
        </li>

        <li className="folder is-note">
          <div className="note-head">
            <div className="note-title">
              <ClipboardCheck aria-hidden="true" size={18} strokeWidth={1.75} />
              <Link to="/staff/students?confirm=1" className="folder-name">
                Student records to confirm
              </Link>
            </div>
          </div>
          <div className="folder-foot">
            <p className="folder-kind">To confirm</p>
            <p className="note-when">{s.toConfirm === 0 ? 'None' : studentCount(s.toConfirm)}</p>
          </div>
        </li>
      </ul>

      <section className="section">
        <h2>By stage</h2>
        <div className="table-wrap">
          <table className="table stage-table">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col" className="bar-cell">
                  <span className="visually-hidden">Share of students</span>
                </th>
                <th scope="col" className="num">
                  Students
                </th>
              </tr>
            </thead>
            <tbody>
              {s.byStage.map((g) => (
                <tr key={g.value}>
                  <th scope="row">
                    {g.students > 0 ? <Link to={`/staff/students?stage=${g.value}`}>{g.label}</Link> : g.label}
                  </th>
                  <td className="bar-cell" aria-hidden="true">
                    <span className="bar">
                      <span style={{ width: `${(g.students / most) * 100}%` }} />
                    </span>
                  </td>
                  <td className="num">{g.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CountTable title="By hub" label="Hub" groups={s.byHub} filter="hub" />
      <CountTable title="By campus" label="Campus" groups={s.byCampus} filter="campus" />
    </>
  )
}

// Students, ideas and waiting videos for each group. A row opens the
// Students list filtered to that group.
function CountTable({ title, label, groups, filter }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{label}</th>
              <th scope="col" className="num">
                Students
              </th>
              <th scope="col" className="num">
                With an idea
              </th>
              <th scope="col" className="num">
                Videos waiting
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id ?? 'none'}>
                <th scope="row">{g.id ? <Link to={`/staff/students?${filter}=${g.id}`}>{g.name}</Link> : g.name}</th>
                <td className="num">{g.students}</td>
                <td className="num">{g.withIdea}</td>
                <td className="num">{g.waiting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Up to four students as round initials, the rest as "+N".
function People({ rows, total }) {
  if (total === 0) return null
  const shown = rows.slice(0, total > 4 ? 3 : 4)
  return (
    <ul className="folder-dots" aria-hidden="true">
      {shown.map((r) => (
        <li key={r.id} title={r.full_name}>
          <Avatar name={r.full_name} className="folder-dot" />
        </li>
      ))}
      {total > shown.length && (
        <li>
          <span className="folder-dot">+{total - shown.length}</span>
        </li>
      )}
    </ul>
  )
}
