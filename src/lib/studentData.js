import { must } from './data.js'
import { supabase } from './supabase.js'

// Published lessons for everyone or for this student's hub, in order.
export async function loadMyLessons(userId) {
  const [me, lessons, done] = await Promise.all([
    supabase.from('profiles').select('hub_id').eq('id', userId).single().then(must),
    supabase
      .from('lessons')
      .select('id, title, description, video_url, hub_id')
      .eq('is_published', true)
      .order('position')
      .order('created_at')
      .then(must),
    supabase.from('lesson_progress').select('lesson_id').eq('student_id', userId).then(must),
  ])
  const mine = lessons.filter((l) => l.hub_id === null || l.hub_id === me.hub_id)
  return { lessons: mine, done: new Set(done.map((d) => d.lesson_id)) }
}

// Meetings coming up (or started in the last 2 hours) and the latest notices.
// RLS gives each student only the ones meant for them.
export async function loadMyNotices() {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const [meetings, notices] = await Promise.all([
    supabase.from('meetings').select('*').gte('starts_at', since).order('starts_at').limit(20).then(must),
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50).then(must),
  ])
  return { meetings, notices }
}
