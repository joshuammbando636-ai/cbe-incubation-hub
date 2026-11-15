import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context.js'
import { supabase } from '../lib/supabase.js'
import { Button } from './ui.jsx'

// Messages for the signed-in person (e.g. "You are now a mentor"), shown at the
// top of every page until they press OK. The database writes them; see schema.sql section 8.
export function Notifications() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    let stale = false
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body')
        .eq('user_id', profile.id)
        .order('created_at')
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

  async function dismiss(n) {
    setItems((list) => list.filter((x) => x.id !== n.id))
    await supabase.from('notifications').delete().eq('id', n.id)
    // A new role needs a fresh start so the right menu appears.
    if (/^You are now/.test(n.title)) window.location.assign('/')
  }

  if (!items.length) return null
  return (
    <section className="notifications" aria-label="Notifications">
      {items.map((n) => (
        <div key={n.id} className="notice notice-wait" role="status">
          <p className="notice-title">{n.title}</p>
          <p>{n.body}</p>
          <Button type="button" variant="secondary" onClick={() => dismiss(n)}>
            OK
          </Button>
        </div>
      ))}
    </section>
  )
}
