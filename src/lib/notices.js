// Pure helpers for meetings and notices (content.md, "Meetings" and "Notices").
import { formatDate } from './labels.js'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')

// "Tue 18 Nov 2026, 14:00", in the viewer's own time zone.
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${DAYS[d.getDay()]} ${formatDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// For <input type="datetime-local">: "2026-11-18T14:00" in local time.
export function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// The local input back to a timestamp for the database, or '' if it is not a date.
export function fromLocalInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value || '')) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

// Meeting links must be https (Google Meet, Zoom, Teams…). The database checks this too.
export function isMeetingLink(value) {
  try {
    return new URL(String(value).trim()).protocol === 'https:'
  } catch {
    return false
  }
}

export function isWebLink(value) {
  try {
    return ['http:', 'https:'].includes(new URL(String(value).trim()).protocol)
  } catch {
    return false
  }
}

// A meeting still counts as "coming up" for 2 hours after it starts, so Join stays visible.
const GRACE = 2 * 60 * 60 * 1000
export function splitMeetings(meetings, now = new Date()) {
  const cut = now.getTime() - GRACE
  const time = (m) => new Date(m.starts_at).getTime()
  return {
    upcoming: meetings.filter((m) => time(m) >= cut).sort((a, b) => time(a) - time(b)),
    past: meetings.filter((m) => time(m) < cut).sort((a, b) => time(b) - time(a)),
  }
}

const nameIn = (list, id) => list?.find((x) => x.id === id)?.name ?? ''

// Who a meeting is for, as staff see it.
export function meetingAudience(m, hubs, students) {
  if (m.student_id) return nameIn(students?.map((s) => ({ id: s.id, name: s.full_name })), m.student_id) || 'One student'
  if (m.hub_id) return nameIn(hubs, m.hub_id) || 'One hub'
  return 'Everyone'
}

// Who a meeting is for, as the student sees it.
export function meetingTag(m) {
  if (m.student_id) return 'For you'
  if (m.hub_id) return 'For your hub'
  return 'For everyone'
}

// Who a notice is for: "Everyone", or the choices joined, like "Dar es Salaam · Accountancy".
export function noticeAudience(n, lists) {
  const parts = [nameIn(lists.campuses, n.campus_id), nameIn(lists.hubs, n.hub_id), nameIn(lists.programmes, n.programme_id)]
  return parts.filter(Boolean).join(' · ') || 'Everyone'
}

// "New" notices: posted after the student last opened the Notices page on this device.
const seenKey = (userId) => `cbe.noticesSeen.${userId}`
export function readSeen(userId) {
  try {
    return localStorage.getItem(seenKey(userId)) || ''
  } catch {
    return ''
  }
}
export function markSeen(userId, when = new Date()) {
  try {
    localStorage.setItem(seenKey(userId), when.toISOString())
  } catch {
    // Storage blocked: every notice just stays unmarked.
  }
}
export const countNew = (notices, seenAt) =>
  notices.filter((n) => !seenAt || new Date(n.created_at) > new Date(seenAt)).length
