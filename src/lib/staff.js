// Pure helpers for the staff screens. Rows come from staffData.js:
// { id, full_name, reg_number, email, hub_id, campus_id, programme_id, needs_review,
//   stage (or null), waiting (count) }

import { STAGES } from './labels.js'

export const NO_IDEA = 'none' // stage filter value for "No idea yet"

const count = (list) => ({
  students: list.length,
  withIdea: list.filter((r) => r.stage).length,
  waiting: list.reduce((n, r) => n + r.waiting, 0),
})

// One count row per group (hub, campus…), plus "Not chosen yet" for the rest.
function groupBy(rows, groups, field) {
  const out = groups.map((g) => ({ id: g.id, name: g.name, ...count(rows.filter((r) => r[field] === g.id)) }))
  const known = new Set(groups.map((g) => g.id))
  const none = rows.filter((r) => !known.has(r[field]))
  if (none.length) out.push({ id: null, name: 'Not chosen yet', ...count(none) })
  return out
}

export function summarize(rows, hubs, campuses = []) {
  return {
    ...count(rows),
    toConfirm: rows.filter((r) => r.needs_review).length,
    byStage: [
      ...STAGES.map((s) => ({ value: s.value, label: s.label, students: rows.filter((r) => r.stage === s.value).length })),
      { value: NO_IDEA, label: 'No idea yet', students: rows.filter((r) => !r.stage).length },
    ],
    byHub: groupBy(rows, hubs, 'hub_id'),
    byCampus: groupBy(rows, campuses, 'campus_id'),
  }
}

const norm = (s) => (s ?? '').toLowerCase()

export function filterStudents(
  rows,
  { q = '', campus = '', hub = '', programme = '', stage = '', confirm = false } = {},
) {
  const words = norm(q).split(/\s+/).filter(Boolean)
  return rows.filter((r) => {
    if (campus && r.campus_id !== campus) return false
    if (hub && r.hub_id !== hub) return false
    if (programme && r.programme_id !== programme) return false
    if (stage === NO_IDEA ? r.stage : stage && r.stage !== stage) return false
    if (confirm && !r.needs_review) return false
    const text = `${norm(r.full_name)} ${norm(r.reg_number)} ${norm(r.email)}`
    return words.every((w) => text.includes(w))
  })
}

export const studentCount = (n) => (n === 1 ? '1 student' : `${n} students`)
