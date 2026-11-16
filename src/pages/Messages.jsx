import { ArrowLeft, PenSquare, Search, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../auth/context.js'
import { Avatar } from '../components/Avatar.jsx'
import { Button, LoadError, Notice, Spinner } from '../components/ui.jsx'
import {
  KINDS,
  MAX_MESSAGE,
  ROLE_LABEL,
  isNotSetUp,
  kindLabel,
  loadContacts,
  loadConversations,
  loadThread,
  markRead,
  sendMessage,
} from '../lib/messages.js'
import { formatDateTime } from '../lib/notices.js'
import { errorMessage } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'

// Direct messages for everyone signed in (students at /student/messages, staff at
// /staff/messages). Left: your conversations and "New message". Right: the chat.
// On phones the list and the chat take turns (?with=<person id> opens a chat).
// New messages are fetched every few seconds while the page is open and visible.

const LIST_EVERY = 20000
const THREAD_EVERY = 8000

// Calls `fn` now and every `ms` while the tab is visible.
function usePoll(fn, ms) {
  useEffect(() => {
    let id = null
    const start = () => {
      if (id === null) id = setInterval(() => document.visibilityState === 'visible' && fn(), ms)
    }
    const onShow = () => document.visibilityState === 'visible' && fn()
    fn()
    start()
    document.addEventListener('visibilitychange', onShow)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [fn, ms])
}

function NotSetUp() {
  return (
    <Notice kind="wait" title="Messages are not switched on yet">
      <p>Please try again later.</p>
    </Notice>
  )
}

function Person({ p, size }) {
  return (
    <Avatar
      name={p.full_name}
      path={p.photo_path}
      avatar={p.avatar}
      gender={p.gender}
      className={size === 'big' ? 'avatar msg-avatar msg-avatar--big' : 'avatar msg-avatar'}
    />
  )
}

function shortTime(value) {
  const d = new Date(value)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ---------- New message: pick someone you may write to ----------

function ContactPicker({ onPick, onClose }) {
  const [contacts, setContacts] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
    loadContacts().then(setContacts, setError)
  }, [])

  if (error) return isNotSetUp(error) ? <NotSetUp /> : <LoadError error={error} />
  const q = query.trim().toLowerCase()
  const shown = (contacts ?? []).filter(
    (c) => !q || c.full_name.toLowerCase().includes(q) || (c.hub ?? '').toLowerCase().includes(q),
  )

  return (
    <div className="msg-picker">
      <div className="msg-picker-head">
        <p className="msg-picker-title">New message</p>
        <button type="button" className="msg-text-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
      <label className="msg-search">
        <Search size={18} aria-hidden="true" />
        <span className="visually-hidden">Search people</span>
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or hub"
        />
      </label>
      {contacts === null ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="msg-empty">{contacts.length ? 'Nobody matches that search.' : 'There is nobody you can write to yet.'}</p>
      ) : (
        <ul className="msg-people">
          {shown.slice(0, 60).map((c) => (
            <li key={c.id}>
              <button type="button" className="msg-person" onClick={() => onPick(c)}>
                <Person p={c} />
                <span className="msg-person-text">
                  <span className="msg-name">{c.full_name}</span>
                  <span className="msg-meta">
                    {ROLE_LABEL[c.role]}
                    {c.role === 'student' && c.hub ? ` · ${c.hub}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------- One chat ----------

function Thread({ me, staff, other, onBack, onSent }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [body, setBody] = useState('')
  const [kind, setKind] = useState('general')
  const [busy, setBusy] = useState(false)
  const [sendError, setSendError] = useState('')
  const end = useRef(null)
  const box = useRef(null)

  const refresh = useCallback(() => {
    loadThread(me.id, other.id).then(
      (data) => {
        setRows((old) => (old && old.length === data.length ? old : data))
        if (data.some((m) => m.sender_id === other.id && !m.read_at)) markRead(other.id).catch(() => {})
      },
      setError,
    )
  }, [me.id, other.id])
  usePoll(refresh, THREAD_EVERY)

  // Keep the newest message in view.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [rows])

  async function submit(e) {
    e.preventDefault()
    if (!body.trim() || busy) return
    setBusy(true)
    setSendError('')
    try {
      await sendMessage(me.id, other.id, body, staff ? kind : 'general')
      setBody('')
      setKind('general')
      refresh()
      onSent()
      box.current?.focus()
    } catch (err) {
      setSendError(isNotSetUp(err) ? 'Messages are not switched on yet.' : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="msg-thread" aria-label={`Chat with ${other.full_name}`}>
      <header className="msg-thread-head">
        <button type="button" className="msg-back" onClick={onBack} aria-label="Back to your conversations">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <Person p={other} size="big" />
        <div>
          <h2 className="msg-thread-name">{other.full_name}</h2>
          <p className="msg-meta">
            {ROLE_LABEL[other.role]}
            {other.hub ? ` · ${other.hub}` : ''}
          </p>
        </div>
      </header>

      <div className="msg-scroll" aria-live="polite">
        {error ? (
          isNotSetUp(error) ? <NotSetUp /> : <LoadError error={error} onRetry={refresh} />
        ) : rows === null ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <p className="msg-empty">No messages yet. Say hello.</p>
        ) : (
          <ol className="msg-bubbles">
            {rows.map((m) => {
              const mine = m.sender_id === me.id
              return (
                <li key={m.id} className={mine ? 'msg-bubble is-mine' : 'msg-bubble'}>
                  {m.kind !== 'general' && <span className={`msg-kind msg-kind--${m.kind}`}>{kindLabel(m.kind)}</span>}
                  <p>{m.body}</p>
                  <time dateTime={m.created_at}>
                    <span className="visually-hidden">{mine ? 'You, ' : `${other.full_name}, `}</span>
                    {formatDateTime(m.created_at)}
                  </time>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={end} />
      </div>

      <form className="msg-compose" onSubmit={submit}>
        {staff && (
          <div className="msg-kinds" role="radiogroup" aria-label="Type of message">
            {KINDS.map((k) => (
              <label key={k.value} className={kind === k.value ? 'msg-chip is-on' : 'msg-chip'}>
                <input
                  type="radio"
                  name="kind"
                  value={k.value}
                  checked={kind === k.value}
                  onChange={() => setKind(k.value)}
                  className="visually-hidden"
                />
                {k.label}
              </label>
            ))}
          </div>
        )}
        <div className="msg-compose-row">
          <label className="visually-hidden" htmlFor="msg-body">
            Message to {other.full_name}
          </label>
          <textarea
            id="msg-body"
            ref={box}
            rows={2}
            maxLength={MAX_MESSAGE}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e)
            }}
            placeholder="Write a message…"
          />
          <Button type="submit" busy={busy} busyLabel="Sending…" disabled={busy || !body.trim()}>
            <Send size={18} aria-hidden="true" /> Send
          </Button>
        </div>
        {sendError && (
          <p className="field-error" role="alert">
            {sendError}
          </p>
        )}
      </form>
    </section>
  )
}

// ---------- The page ----------

export function Messages() {
  useTitle('Messages')
  const { profile: me } = useAuth()
  const staff = me.role !== 'student'
  const [params, setParams] = useSearchParams()
  const withId = params.get('with')
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState(null) // a contact with no conversation yet

  const refreshList = useCallback(() => {
    loadConversations().then((rows) => {
      setList(rows)
      setError(null)
    }, setError)
  }, [])
  usePoll(refreshList, LIST_EVERY)

  // Opening /…/messages?with=<id> from elsewhere (e.g. a student's page) for someone
  // you have not written to yet: find them among your contacts.
  useEffect(() => {
    if (!withId || !list || list.some((c) => c.other_id === withId) || picked?.id === withId) return
    loadContacts().then(
      (rows) => setPicked(rows.find((c) => c.id === withId) ?? { id: withId, missing: true }),
      () => setPicked({ id: withId, missing: true }),
    )
  }, [withId, list, picked])

  const open = (id) => setParams(id ? { with: id } : {})
  const fromList = list?.find((c) => c.other_id === withId)
  const found = fromList ? { ...fromList, id: fromList.other_id } : picked?.id === withId ? picked : null
  const other = found?.missing ? null : found

  if (error && !list) {
    return (
      <>
        <h1>Messages</h1>
        {isNotSetUp(error) ? <NotSetUp /> : <LoadError error={error} onRetry={refreshList} />}
      </>
    )
  }

  return (
    <>
      <h1 className="msg-title">Messages</h1>
      <div className={withId ? 'msg-page has-thread' : 'msg-page'}>
        <aside className="msg-list" aria-label="Your conversations">
          {picking ? (
            <ContactPicker
              onClose={() => setPicking(false)}
              onPick={(c) => {
                setPicked(c)
                setPicking(false)
                open(c.id)
              }}
            />
          ) : (
            <>
              <button type="button" className="btn btn-primary msg-new" onClick={() => setPicking(true)}>
                <PenSquare size={18} aria-hidden="true" /> New message
              </button>
              {list === null ? (
                <Spinner />
              ) : list.length === 0 ? (
                <p className="msg-empty">
                  {staff
                    ? 'No conversations yet. Start one with New message.'
                    : 'No messages yet. Write to your mentor with New message.'}
                </p>
              ) : (
                <ul className="msg-people">
                  {list.map((c) => (
                    <li key={c.other_id}>
                      <button
                        type="button"
                        className={c.other_id === withId ? 'msg-person is-open' : 'msg-person'}
                        onClick={() => open(c.other_id)}
                        aria-current={c.other_id === withId ? 'true' : undefined}
                      >
                        <Person p={c} />
                        <span className="msg-person-text">
                          <span className="msg-row-top">
                            <span className="msg-name">{c.full_name}</span>
                            <span className="msg-when">{shortTime(c.last_at)}</span>
                          </span>
                          <span className="msg-preview">
                            {c.last_from_me ? 'You: ' : ''}
                            {c.last_body}
                          </span>
                        </span>
                        {c.unread > 0 && (
                          <span className="msg-unread">
                            {c.unread}
                            <span className="visually-hidden"> unread</span>
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>

        {other ? (
          <Thread key={other.id} me={me} staff={staff} other={other} onBack={() => open(null)} onSent={refreshList} />
        ) : found?.missing ? (
          <section className="msg-thread msg-thread--empty">
            <p className="msg-empty">You cannot write to this person.</p>
          </section>
        ) : withId ? (
          <section className="msg-thread msg-thread--empty">
            <Spinner />
          </section>
        ) : (
          <section className="msg-thread msg-thread--empty">
            <p className="msg-empty">Choose a conversation, or start one with New message.</p>
          </section>
        )}
      </div>
    </>
  )
}
