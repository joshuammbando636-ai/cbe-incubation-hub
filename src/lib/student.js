import { MSG } from './text.js'

// The details counted for "{n} details missing" on the student home page.
// Programme is left out: its hint tells students to leave it empty when theirs
// is not on the list. Cluster is left out: it comes from the hub.
export const PROFILE_DETAILS = [
  'full_name',
  'reg_number',
  'gender',
  'phone',
  'campus_id',
  'department_id',
  'level_id',
  'grad_year',
  'hub_id',
]

export function missingDetails(profile) {
  return PROFILE_DETAILS.filter((key) => {
    const v = profile?.[key]
    return v === null || v === undefined || String(v).trim() === ''
  }).length
}

export const missingLabel = (n) => (n === 1 ? '1 detail missing' : `${n} details missing`)

// Registration numbers look like 03.12345.01.01.2026: groups of digits joined by dots.
// A stray dot at either end (easy to copy from the hint's full stop) is dropped.
export function cleanRegNumber(value) {
  return value.replace(/\s+/g, '').replace(/^\.+|\.+$/g, '')
}
export function checkRegNumber(value) {
  const v = cleanRegNumber(value)
  if (!v) return ''
  return /^\d+(\.\d+){2,}$/.test(v) ? '' : MSG.badRegNumber
}

// Tanzanian numbers. Stored as 0712345678 so the Excel file is consistent.
export function cleanPhone(value) {
  const digits = value.replace(/[\s().-]/g, '')
  if (/^\+?255\d{9}$/.test(digits)) return `0${digits.slice(-9)}`
  return digits
}
export function checkPhone(value) {
  const v = cleanPhone(value)
  if (!v) return ''
  return /^0\d{9}$/.test(v) ? '' : MSG.badPhone
}

export function checkGradYear(value) {
  const v = String(value).trim()
  if (!v) return ''
  const n = Number(v)
  return /^\d{4}$/.test(v) && n >= 2000 && n <= 2100 ? '' : MSG.badYear
}

export const countDone = (lessons, done) => lessons.filter((l) => done.has(l.id)).length

// The one thing a student should do next, shown as the blue card on Home.
// Returns { title, line, to, action } or null when nothing is waiting on them.
export function nextStep({ missing, idea, latest, lessonsLeft, lastStage }) {
  if (missing > 0) {
    return { title: 'Complete your profile', line: `${missingLabel(missing)}.`, to: '/student/profile', action: 'Open profile' }
  }
  if (!idea) {
    return { title: 'Add your business idea', line: 'Tell us what you are building.', to: '/student/idea', action: 'Add idea' }
  }
  if (latest?.status === 'rejected') {
    return { title: 'Post a new progress video', line: 'Read the mentor feedback first.', to: '/student/progress', action: 'Open progress' }
  }
  if (!latest) {
    return { title: 'Post your first progress video', line: 'A short video moves you up a stage.', to: '/student/progress', action: 'Post a video' }
  }
  if (lessonsLeft > 0) {
    return {
      title: 'Continue your lessons',
      line: lessonsLeft === 1 ? '1 lesson left.' : `${lessonsLeft} lessons left.`,
      to: '/student/lessons',
      action: 'Open lessons',
    }
  }
  if (latest.status === 'verified' && !lastStage) {
    return { title: 'Post your next progress video', line: 'Show what has changed since the last one.', to: '/student/progress', action: 'Post a video' }
  }
  return null
}
