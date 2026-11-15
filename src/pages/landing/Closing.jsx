import { useRef } from 'react'
import { Link } from 'react-router'
import { APP_NAME, FOOTER } from '../../lib/text.js'
import { RollText, SectionLink } from './bits.jsx'
import { gsap, useSectionMotion } from './motion.js'
import { Badge } from './shapes.jsx'

const CTA = 'Create your account'
const CLOSING = ['Idea.', 'Prototype.', 'Running.', 'Earning.']

export function FinalCta() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ q }) => {
    gsap.from(q('.l-closing__word'), {
      y: 90,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: q('.l-closing')[0], start: 'top 85%', once: true },
    })
  })

  return (
    <section className="l-section l-cta" ref={ref}>
      <div className="l-wrap">
        <div className="l-cta__panel" data-reveal>
          <h2>Ready to start your business?</h2>
          <p>It takes one minute to create your account.</p>
          {/* Letters wiggle on hover (desktop); the link is still named "Create your account". */}
          <Link to="/signup" className="l-btn l-btn--white l-wiggle" aria-label={CTA}>
            <span aria-hidden="true">
              {Array.from(CTA).map((ch, i) => (
                <span key={i}>{ch === ' ' ? ' ' : ch}</span>
              ))}
            </span>
          </Link>
        </div>

        <p className="l-closing">
          {CLOSING.map((word, i) => (
            <span key={word} className="l-closing__mask" style={{ '--i': i }}>
              <span className="l-closing__word">{word}</span>{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="l-footer">
      <div className="l-wrap l-footer__inner">
        <Link to="/" className="l-footer__logo">
          <Badge />
          <span>{APP_NAME}</span>
        </Link>
        <nav aria-label="Footer" className="l-footer__links">
          <SectionLink id="how">
            <RollText>How it works</RollText>
          </SectionLink>
          <SectionLink id="hubs">
            <RollText>Hubs</RollText>
          </SectionLink>
          <SectionLink id="faq">
            <RollText>FAQ</RollText>
          </SectionLink>
          <Link to="/login">
            <RollText>Sign in</RollText>
          </Link>
        </nav>
        <p className="l-footer__small">{FOOTER}</p>
      </div>
    </footer>
  )
}
