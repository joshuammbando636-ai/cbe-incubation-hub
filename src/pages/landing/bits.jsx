import { scrollToSection } from './motion.js'

// Hover roll: two stacked copies in a clipped box; on hover both move up one line.
export function RollText({ children }) {
  return (
    <span className="l-roll">
      <span className="l-roll__a">{children}</span>
      <span className="l-roll__b" aria-hidden="true">
        {children}
      </span>
    </span>
  )
}

// In-page link (#how, #hubs…) that scrolls through Lenis and moves focus there.
export function SectionLink({ id, className, children }) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        scrollToSection(id)
      }}
    >
      {children}
    </a>
  )
}
