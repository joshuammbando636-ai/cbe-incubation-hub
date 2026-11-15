import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { gsap, pauseOffscreen, SCRUB, useSectionMotion } from './motion.js'

const WORDS = ['idea', 'prototype', 'side hustle', 'class project', 'first sale']

export function Hero({ ready }) {
  const ref = useRef(null)

  useSectionMotion(
    ref,
    ({ desktop, root, q }) => {
      if (!ready) return undefined

      // Entrance: headline lines rise out of their masks.
      gsap
        .timeline({ delay: 0.1 })
        .from(q('.l-mask__in'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0)
        .from(q('.l-hero__lede, .l-hero__ctas'), { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.35)

      // Rotating word: old one slides up and fades, the new one rises from below.
      const words = q('.l-word__item')
      gsap.set(words, { visibility: 'visible', yPercent: (i) => (i === 0 ? 0 : 110), opacity: (i) => (i === 0 ? 1 : 0) })
      const loop = gsap.timeline({ repeat: -1, delay: 2.2 })
      words.forEach((word, i) => {
        const next = words[(i + 1) % words.length]
        const at = i * 2.2
        loop
          .to(word, { yPercent: -110, opacity: 0, duration: 0.55, ease: 'expo.out' }, at)
          .fromTo(next, { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 0.55, ease: 'expo.out', immediateRender: false }, at + 0.15)
      })
      loop.set({}, {}, words.length * 2.2)
      const stopWatching = pauseOffscreen(root, loop)

      // Scroll (desktop): the headline lifts away.
      const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: SCRUB }
      if (desktop) {
        gsap.to(q('.l-hero__title'), { y: -120, opacity: 0, ease: 'none', scrollTrigger: { ...scrub, end: '60% top' } })
      }
      return stopWatching
    },
    [ready],
  )

  return (
    <section className="l-hero" ref={ref}>
      <div className="l-wrap">
        <h1 className="l-hero__title">
          <span className="visually-hidden">Turn your idea into a business.</span>
          <span className="l-hero__lines" aria-hidden="true">
            <span className="l-mask l-mask--lead">
              <span className="l-mask__in">Turn your</span>
            </span>{' '}
            <span className="l-mask l-mask--word">
              <span className="l-mask__in l-word">
                {WORDS.map((w) => (
                  <span key={w} className="l-word__item">
                    {w}
                  </span>
                ))}
              </span>
            </span>{' '}
            <span className="l-mask l-mask--last">
              <span className="l-mask__in">into a business.</span>
            </span>
          </span>
        </h1>
        <p className="l-hero__lede">
          Join an innovation hub, get a mentor in your field, and grow your business one stage at a time.
        </p>
        <div className="l-hero__ctas">
          <Link to="/signup" className="l-btn l-btn--primary">
            Create your account <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link to="/login" className="l-btn l-btn--ghost">
            Sign in
          </Link>
        </div>
      </div>

    </section>
  )
}
