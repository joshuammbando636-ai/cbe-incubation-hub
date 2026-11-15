import { scrollToSection } from './motion.js'

// Letter roll (from compasspathways.com): the label is written twice in a
// clipped box, one span per letter. On hover or keyboard focus every letter of
// both copies slides up one line, 0.015s after the one before it (CSS only,
// see .l-roll in landing.css). Screen readers hear the hidden plain label.
function letters(text, copy) {
  return (
    <span className={copy} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="l-roll__ch" style={{ '--i': i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

export function RollText({ children }) {
  if (typeof children !== 'string') {
    return (
      <span className="l-roll">
        <span className="l-roll__a l-roll__solid">{children}</span>
        <span className="l-roll__b l-roll__solid" aria-hidden="true">
          {children}
        </span>
      </span>
    )
  }
  return (
    <span className="l-roll">
      <span className="visually-hidden">{children}</span>
      {letters(children, 'l-roll__a')}
      {letters(children, 'l-roll__b')}
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
