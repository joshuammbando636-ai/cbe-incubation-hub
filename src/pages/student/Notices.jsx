import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context.js'
import { LoadError, Spinner } from '../../components/ui.jsx'
import { useLoad } from '../../lib/data.js'
import { formatDate } from '../../lib/labels.js'
import { formatDateTime, isWebLink, markSeen, meetingTag, readSeen } from '../../lib/notices.js'
import { loadMyNotices } from '../../lib/studentData.js'
import { useTitle } from '../../lib/useTitle.js'

export function StudentNotices() {
  useTitle('Notices')
  const { profile } = useAuth()
  const page = useLoad(loadMyNotices, [profile.id], `notices:${profile.id}`)
  // Remember when they last looked, before marking everything as seen.
  const [seenBefore] = useState(() => readSeen(profile.id))
  useEffect(() => {
    if (page.data) markSeen(profile.id)
  }, [page.data, profile.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />

  const { meetings, notices } = page.data
  const isNew = (n) => !seenBefore || new Date(n.created_at) > new Date(seenBefore)

  return (
    <div className="narrow-content">
      <h1>Notices</h1>
      <p className="lede">Meetings and news from your mentors.</p>

      <section className="section">
        <h2>Coming up</h2>
        {meetings.length === 0 ? (
          <p>No meetings coming up.</p>
        ) : (
          <ul className="rows">
            {meetings.map((m) => (
              <li key={m.id} className="row meeting-item">
                <p className="tag">{meetingTag(m)}</p>
                <h3>{m.title}</h3>
                <p className="row-meta">{formatDateTime(m.starts_at)}</p>
                {m.note && <p className="notice-body">{m.note}</p>}
                <p>
                  <a href={m.link} target="_blank" rel="noopener noreferrer">
                    Join meeting<span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Notices</h2>
        {notices.length === 0 ? (
          <p>No notices yet.</p>
        ) : (
          <ul className="rows">
            {notices.map((n) => (
              <li key={n.id} className="row notice-item">
                <p className="tag">
                  {formatDate(n.created_at)}
                  {isNew(n) && (
                    <>
                      {' '}
                      <span className="status status-wait">New</span>
                    </>
                  )}
                </p>
                <h3>{n.title}</h3>
                <p className="notice-body">{n.body}</p>
                {n.link && isWebLink(n.link) && (
                  <p>
                    <a href={n.link} target="_blank" rel="noopener noreferrer">
                      Open link<span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
