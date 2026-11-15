import { avatarFor, avatarSrc } from '../lib/avatars.js'
import { usePhotoUrl } from '../lib/photos.js'

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase() || '?'
}

// The person's photo; else the drawing they picked (or the default for their
// gender); else their initials.
export function Avatar({ name, path, avatar, gender, className = 'avatar' }) {
  const url = usePhotoUrl(path)
  const drawing = avatarFor({ avatar, gender })
  const src = url ?? (drawing ? avatarSrc(drawing) : null)
  return (
    <span className={className} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  )
}
