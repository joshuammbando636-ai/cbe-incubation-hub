import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/context.js'
import { DownloadExcel } from '../../components/DownloadExcel.jsx'
import { Checkbox, LoadError, SearchSelect, SelectField, Spinner } from '../../components/ui.jsx'
import { nameOf, useLoad } from '../../lib/data.js'
import { STAGES, stageLabel } from '../../lib/labels.js'
import { filterPeople } from '../../lib/admin.js'
import { NO_IDEA, filterStudents, studentCount } from '../../lib/staff.js'
import { loadStaffPage, staffPageKey } from '../../lib/staffData.js'
import { useTitle } from '../../lib/useTitle.js'
import { NoHubs } from './Overview.jsx'

const STAGE_FILTER = [...STAGES.map((s) => ({ value: s.value, label: s.label })), { value: NO_IDEA, label: 'No idea yet' }]

export function Students() {
  const { profile } = useAuth()
  useTitle(profile.role === 'admin' ? 'People' : 'Students')
  const page = useLoad(() => loadStaffPage(profile), [profile.id], staffPageKey(profile))
  // Filters live in the address, so "back" from a student keeps them.
  const [params, setParams] = useSearchParams()
  const filters = {
    q: params.get('q') ?? '',
    campus: params.get('campus') ?? '',
    hub: params.get('hub') ?? '',
    programme: params.get('programme') ?? '',
    stage: params.get('stage') ?? '',
    confirm: params.get('confirm') === '1',
    show: params.get('show') ?? '',
  }
  const setFilter = (key, value) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { isAdmin, hubs, rows, lists, staff } = page.data
  const linkState = { search: params.size ? `?${params}` : '' }
  const tabs = isAdmin && (
    <div className="tabs tabs-wrap" role="group" aria-label="Show">
      <button type="button" aria-pressed={filters.show !== 'staff'} onClick={() => setFilter('show', '')}>
        Students ({rows.length})
      </button>
      <button type="button" aria-pressed={filters.show === 'staff'} onClick={() => setFilter('show', 'staff')}>
        Mentors and admins ({staff.length})
      </button>
    </div>
  )

  if (isAdmin && filters.show === 'staff') {
    return (
      <>
        <h1>People</h1>
        {tabs}
        <StaffList staff={staff} hubs={hubs} q={filters.q} setQ={(v) => setFilter('q', v)} linkState={linkState} />
      </>
    )
  }

  if (!isAdmin && hubs.length === 0) {
    return (
      <>
        <h1>Students</h1>
        <NoHubs />
      </>
    )
  }

  const shown = filterStudents(rows, filters)
  const filtering = filters.q || filters.campus || filters.hub || filters.programme || filters.stage || filters.confirm
  // Only programmes that someone in this list is studying, so the dropdown stays short.
  const inUse = new Set(rows.map((r) => r.programme_id))
  const programmes = lists.programmes.filter((p) => inUse.has(p.id))

  return (
    <>
      <h1>{isAdmin ? 'People' : 'Students'}</h1>
      {tabs}
      {isAdmin && (
        <p className="hint">Everyone signs up as a student. To make someone a mentor, open them and change their role.</p>
      )}

      <div className="filters">
        <div className="field filter-search">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            placeholder="Name, registration number or email"
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
          />
        </div>
        <SelectField
          id="campus"
          label="Campus"
          placeholder="All campuses"
          options={lists.campuses.map((c) => ({ value: c.id, label: c.name }))}
          value={filters.campus}
          onChange={(e) => setFilter('campus', e.target.value)}
        />
        <SearchSelect
          id="hub"
          label="Hub"
          placeholder="All hubs"
          options={hubs.map((h) => ({ value: h.id, label: h.name }))}
          value={filters.hub}
          onChange={(e) => setFilter('hub', e.target.value)}
        />
        <SearchSelect
          id="programme"
          label="Programme"
          placeholder="All programmes"
          options={programmes.map((p) => ({ value: p.id, label: p.name }))}
          value={filters.programme}
          onChange={(e) => setFilter('programme', e.target.value)}
        />
        <SelectField
          id="stage"
          label="Stage"
          placeholder="Any stage"
          options={STAGE_FILTER}
          value={filters.stage}
          onChange={(e) => setFilter('stage', e.target.value)}
        />
        <Checkbox label="To confirm only" checked={filters.confirm} onChange={(on) => setFilter('confirm', on ? '1' : '')} />
      </div>

      <p className="count" aria-live="polite">
        {studentCount(shown.length)}
      </p>

      <DownloadExcel isAdmin={isAdmin} hubs={hubs} />

      {shown.length === 0 ? (
        <p>{filtering ? 'No students match.' : 'No students yet.'}</p>
      ) : (
        <ul className="rows">
          {shown.map((s) => (
            <li key={s.id} className="row student-row">
              <Link to={`/staff/students/${s.id}`} state={linkState} className="row-link">
                <span className="row-title">{s.full_name || s.email}</span>
                <span className="row-meta">
                  {[s.reg_number, nameOf(lists.hubs, s.hub_id), s.stage ? stageLabel(s.stage) : 'No idea yet']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {s.waiting > 0 && <span className="status status-pending">Video waiting</span>}
                {s.needs_review && <span className="status status-wait">To confirm</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// Admin: mentors and admins. Open one to change their role or hubs.
function StaffList({ staff, hubs, q, setQ, linkState }) {
  const shown = filterPeople(staff, 'all', q)
  return (
    <>
      <div className="field">
        <label htmlFor="q">Search</label>
        <input id="q" type="search" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="count" aria-live="polite">
        {shown.length === 1 ? '1 person' : `${shown.length} people`}
      </p>
      {shown.length === 0 ? (
        <p>No one matches. To add a mentor, find them under Students and change their role.</p>
      ) : (
        <ul className="rows">
          {shown.map((p) => (
            <li key={p.id} className="row">
              <Link to={`/staff/students/${p.id}`} state={linkState} className="row-link">
                <span className="row-title">{p.full_name || p.email}</span>
                <span className="row-meta">
                  {p.role === 'admin'
                    ? 'Admin'
                    : p.hubIds.length
                      ? `Mentor · ${p.hubIds.map((id) => nameOf(hubs, id)).join(', ')}`
                      : 'Mentor · no hubs yet'}
                </span>
                {p.role === 'mentor' && p.hubIds.length === 0 && <span className="status status-wait">Needs a hub</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
