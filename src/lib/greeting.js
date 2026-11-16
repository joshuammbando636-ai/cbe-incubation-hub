// A respectful greeting for mentors and admins (Josh, 16 Nov 2026):
// time of day + title + surname, e.g. "Good morning, Mr. Godwin."
// Ms. for women (it does not depend on marriage). With no gender on the
// profile there is no title, so the full name is used instead.

export const ROLE_TITLE = { admin: 'Administrator', mentor: 'Mentor' }

export function partOfDay(now = new Date()) {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function staffGreeting({ full_name: fullName, gender } = {}, now = new Date()) {
  const part = partOfDay(now)
  const names = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (names.length === 0) return `${part}.`
  const title = gender === 'male' ? 'Mr.' : gender === 'female' ? 'Ms.' : ''
  return title ? `${part}, ${title} ${names.at(-1)}.` : `${part}, ${names.join(' ')}.`
}
