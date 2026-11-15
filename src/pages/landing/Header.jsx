import { ArrowUpRight } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { RollText, SectionLink } from './bits.jsx'
import { gsap, SCRUB, ScrollTrigger, useSectionMotion } from './motion.js'
import { Badge } from './shapes.jsx'

const LINKS = [
  ['how', 'How it works'],
  ['stages', 'Stages'],
  ['hubs', 'Hubs'],
  ['faq', 'FAQ'],
]

// Glass pill header. Over a dark section it turns dark; on desktop it shrinks
// to 760px wide as you scroll the first 500px.
export function Header() {
  const bar = useRef(null)

  // Dark or light, decided from where the dark sections are on every scroll update.
  useLayoutEffect(() => {
    const nav = bar.current.firstElementChild
    const line = () => nav.getBoundingClientRect().top + nav.offsetHeight / 2
    const check = () => {
      const y = line()
      const dark = Array.from(document.querySelectorAll('[data-dark="true"]')).some((s) => {
        const r = s.getBoundingClientRect()
        return r.top <= y && r.bottom >= y
      })
      nav.classList.toggle('is-dark', dark)
    }
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: check, onRefresh: check })
    check()
    return () => st.kill()
  }, [])

  useSectionMotion(bar, ({ desktop, root }) => {
    if (!desktop) return
    const nav = root.firstElementChild
    gsap.fromTo(
      nav,
      { maxWidth: () => `${root.clientWidth}px`, height: 60 },
      {
        maxWidth: '760px',
        height: 48,
        ease: 'none',
        scrollTrigger: { start: 0, end: 500, scrub: SCRUB, invalidateOnRefresh: true },
      },
    )
  })

  return (
    <header className="l-nav-bar" ref={bar}>
      <div className="l-nav">
        <Link to="/" className="l-nav__logo" aria-label="CBE Incubation Hub, home">
          <Badge />
          <span className="l-nav__name" aria-hidden="true">
            Incubation Hub
          </span>
        </Link>
        <nav className="l-nav__links" aria-label="Page">
          {LINKS.map(([id, label]) => (
            <SectionLink key={id} id={id} className="l-nav__link">
              <RollText>{label}</RollText>
            </SectionLink>
          ))}
        </nav>
        <div className="l-nav__actions">
          <Link to="/login" className="l-nav__link l-nav__signin">
            <RollText>Sign in</RollText>
          </Link>
          <Link to="/signup" className="l-join">
            Join
            <span className="l-join__icon" aria-hidden="true">
              <ArrowUpRight size={16} strokeWidth={2.25} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
