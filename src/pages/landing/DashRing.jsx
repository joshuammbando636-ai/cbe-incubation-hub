// A grid of short white dashes. Each dash starts at a steep angle and turns
// flat as the page scrolls (see the callers' ScrollTrigger scrub). Computers only:
// the phone shows the grid still, in its flat start position.
import { DASHES } from './dashes.js'

export function DashRing({ className = '' }) {
  return (
    <div className={`f-dash ${className}`} aria-hidden="true">
      {DASHES.map((d, i) => (
        <span key={i} style={{ '--a': `${d.flat}deg` }} />
      ))}
    </div>
  )
}
