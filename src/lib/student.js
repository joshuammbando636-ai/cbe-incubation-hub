import { MSG } from './text.js'

// The details counted for "{n} details missing" on the student home page.
// Programme is left out: its hint tells students to leave it empty when theirs
// is not on the list.
export const PROFILE_DETAILS = [
  'full_name',
  'reg_number',
  'gender',
  'phone',
  'campus_id',
  'department_id',
  'level_id',
  'grad_year',
  'cluster_id',
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
