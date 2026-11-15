import { Link } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { LoadError, Spinner } from '../../components/ui.jsx'
import { useLoad } from '../../lib/data.js'
import { summarize } from '../../lib/staff.js'
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
  return (
    <>
      <h1>Overview</h1>
      <p className="lede">{isAdmin ? 'All hubs.' : `Your hubs: ${hubs.map((h) => h.name).join(', ')}.`}</p>

      <dl className="numbers">
        <Stat label="Students" value={s.students} to="/staff/students" />
        <Stat label="With an idea" value={s.withIdea} />
        <Stat label="Videos waiting" value={s.waiting} to="/staff/reviews" />
        <Stat label="Records to confirm" value={s.toConfirm} to="/staff/students?confirm=1" />
      </dl>

      <section className="section">
        <h2>By stage</h2>
        <div className="table-wrap">
          <table className="table stage-table">
            <thead>
              <tr>
                <th scope="col">Stage</th>
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

function Stat({ label, value, to }) {
  return (
    <div className="number">
      <dt>{label}</dt>
      <dd>{to && value > 0 ? <Link to={to}>{value}</Link> : value}</dd>
    </div>
  )
}
