// What staff can load. RLS decides the rows: a mentor gets only students in
// their hubs, an admin gets everyone. These queries never filter by hub for
// security, only for display.
import { loadLists, must } from './data.js'
import { supabase } from './supabase.js'

// The hubs this person looks after: all for an admin, assigned ones for a mentor.
export async function loadScope(profile) {
  const lists = await loadLists()
  const isAdmin = profile.role === 'admin'
  if (isAdmin) return { lists, isAdmin, hubs: lists.hubs }
  const rows = must(await supabase.from('mentor_hubs').select('hub_id').eq('mentor_id', profile.id))
  const mine = new Set(rows.map((r) => r.hub_id))
  return { lists, isAdmin, hubs: lists.hubs.filter((h) => mine.has(h.id)) }
}

// The Overview and Students pages load the same thing, so they share a cache key.
export const staffPageKey = (profile) => `staff:${profile.id}`
export async function loadStaffPage(profile) {
  const [scope, rows] = await Promise.all([loadScope(profile), loadStudentRows()])
  return { ...scope, rows }
}

// One row per visible student, with their idea stage and waiting videos.
export async function loadStudentRows() {
  const [students, ideas, pending] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, reg_number, email, hub_id, campus_id, programme_id, needs_review')
      .eq('role', 'student')
      .order('full_name')
      .then(must),
    supabase.from('startup_ideas').select('id, owner_id, stage').then(must),
    supabase.from('progress_updates').select('idea_id').eq('status', 'pending').then(must),
  ])
  const ideaByOwner = new Map(ideas.map((i) => [i.owner_id, i]))
  const waitingByIdea = new Map()
  for (const p of pending) waitingByIdea.set(p.idea_id, (waitingByIdea.get(p.idea_id) ?? 0) + 1)
  return students.map((s) => {
    const idea = ideaByOwner.get(s.id)
    return { ...s, stage: idea?.stage ?? null, waiting: idea ? (waitingByIdea.get(idea.id) ?? 0) : 0 }
  })
}

// Rows for the Excel file. RLS limits them to the hubs this person may see.
// Fetched in pages because Supabase returns at most 1000 rows per request.
export async function loadExportRows(select) {
  const PAGE = 1000
  const all = []
  for (let from = 0; ; from += PAGE) {
    const page = must(
      await supabase
        .from('students_export')
        .select(select)
        .order('full_name')
        .order('id')
        .range(from, from + PAGE - 1),
    )
    all.push(...page)
    if (page.length < PAGE) return all
  }
}

// People who can be picked as a student's mentor.
export async function loadMentors() {
  return must(
    await supabase.from('profiles').select('id, full_name, role').in('role', ['mentor', 'admin']).order('full_name'),
  )
}

// Everything on the one-student page.
export async function loadStudent(id) {
  const [profile, idea, support, lessons, ticks] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'student').maybeSingle().then(must),
    supabase.from('startup_ideas').select('*').eq('owner_id', id).maybeSingle().then(must),
    supabase.from('student_support').select('support_type_id').eq('student_id', id).then(must),
    supabase.from('lessons').select('id, hub_id').eq('is_published', true).then(must),
    supabase.from('lesson_progress').select('lesson_id').eq('student_id', id).then(must),
  ])
  // Lessons this student can see (for everyone, or for their hub), and how many they ticked.
  const theirs = lessons.filter((l) => !l.hub_id || l.hub_id === profile?.hub_id).map((l) => l.id)
  const ticked = new Set(ticks.map((t) => t.lesson_id))
  const lessonCount = { total: theirs.length, done: theirs.filter((lid) => ticked.has(lid)).length }
  const videos = idea
    ? must(
        await supabase
          .from('progress_updates')
          .select('*')
          .eq('idea_id', idea.id)
          .order('created_at', { ascending: false }),
      )
    : []
  return { profile, idea, support: support.map((s) => s.support_type_id), videos, lessonCount }
}

// Videos with the student and idea they belong to, newest first.
export async function loadReviews(status) {
  let q = supabase.from('progress_updates').select('*')
  q = status === 'pending' ? q.eq('status', 'pending').order('created_at') : q.neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(100)
  const videos = must(await q)
  if (!videos.length) return []
  const ideaIds = [...new Set(videos.map((v) => v.idea_id))]
  const ideas = must(await supabase.from('startup_ideas').select('id, owner_id, stage').in('id', ideaIds))
  const ownerIds = [...new Set(ideas.map((i) => i.owner_id))]
  const owners = must(await supabase.from('profiles').select('id, full_name, hub_id').in('id', ownerIds))
  const ideaById = new Map(ideas.map((i) => [i.id, i]))
  const ownerById = new Map(owners.map((o) => [o.id, o]))
  return videos
    .map((v) => {
      const idea = ideaById.get(v.idea_id)
      return { ...v, idea, student: idea && ownerById.get(idea.owner_id) }
    })
    .filter((v) => v.idea && v.student)
}
