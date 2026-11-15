import { BadgeCheck, Bell, UserMinus, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context.js'
import { supabase } from '../lib/supabase.js'

// Messages for the signed-in person (e.g. "You are now a mentor"), shown at the
// top of every page until they close them. The database writes them; see schema.sql section 8.

function iconFor(title) {
  if (/^You are now/.test(title)) return BadgeCheck
  if (/^Removed/.test(title)) return UserMinus
  if (/^New hub/.test(title)) return UserPlus
  return Bell
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export function Notifications() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    let stale = false
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (data && !stale) setItems(data)
    }
    load()
    // Check again when they come back to the tab.
    const onShow = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onShow)
    return () => {
      stale = true
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [profile.id])

  async function dismiss(list) {
    const ids = list.map((n) => n.id)
    setItems((all) => all.filter((x) => !ids.includes(x.id)))
    await supabase.from('notifications').delete().in('id', ids)
    // A new role needs a fresh start so the right menu appears.
    if (list.some((n) => /^You are now/.test(n.title))) window.location.assign('/')
  }

  if (!items.length) return null
  return (
    <section className="alerts" aria-label="Notifications">
      <div className="alerts-head">
        <span className="alerts-count">
          <Bell size={16} aria-hidden="true" />
          {items.length === 1 ? '1 new notification' : `${items.length} new notifications`}
        </span>
        {items.length > 1 && (
          <button type="button" className="alerts-clear" onClick={() => dismiss(items)}>
            Clear all
          </button>
        )}
      </div>
      <ul className="alerts-list">
        {items.map((n, i) => {
          const Icon = iconFor(n.title)
          return (
            <li key={n.id} className="alert-card" role="status" style={{ '--i': i }}>
              <span className="alert-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <div className="alert-text">
                <p className="alert-title">{n.title}</p>
                <p className="alert-body">{n.body}</p>
                <time className="alert-time" dateTime={n.created_at}>
                  {timeAgo(n.created_at)}
                </time>
              </div>
              <button type="button" className="alert-close" onClick={() => dismiss([n])} aria-label={`Close: ${n.title}`}>
                <X size={18} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
