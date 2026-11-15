// Default profile pictures: drawings in public/avatars (WebP, 320 px square).
// A person picks one until they add a photo (profiles.avatar, migration 006).
// With nothing picked, the first drawing for their gender shows.

export const AVATARS = {
  female: ['female-1', 'female-2', 'female-3'],
  male: ['male-1', 'male-2', 'male-3', 'male-4'],
}

export const avatarSrc = (name) => `/avatars/${name}.webp`

// The drawing to show for this person, or null (then initials show).
export function avatarFor({ avatar, gender } = {}) {
  if (avatar) return avatar
  return AVATARS[gender]?.[0] ?? null
}

// Drawings to offer: the person's gender first, then the rest.
export function avatarChoices(gender) {
  const other = gender === 'female' ? 'male' : 'female'
  return AVATARS[gender] ? [...AVATARS[gender], ...AVATARS[other]] : [...AVATARS.female, ...AVATARS.male]
}
