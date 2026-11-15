// Pure helpers for the admin screens.

export const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'admin', label: 'Admin' },
]

// The question asked before a role changes (content.md).
export function roleQuestion(name, role) {
  if (role === 'admin') return `Make ${name} an admin? Admins can see and change everything.`
  if (role === 'mentor') return `Make ${name} a mentor?`
  return `Change ${name} back to student? They will lose access to student records.`
}

// People shown on the People page: one role ('all' for everyone), then the
// typed words matched against name and email, ignoring capitals and order.
export function filterPeople(people, role, text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  return people.filter((p) => {
    if (role !== 'all' && p.role !== role) return false
    const hay = `${p.full_name || ''} ${p.email}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}

// What to add and remove to turn `saved` into `wanted`.
export function diff(saved, wanted) {
  const s = new Set(saved)
  const w = new Set(wanted)
  return { add: [...w].filter((x) => !s.has(x)), remove: [...s].filter((x) => !w.has(x)) }
}
