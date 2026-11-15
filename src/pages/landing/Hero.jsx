import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { gsap, pauseOffscreen, SCRUB, useSectionMotion } from './motion.js'
import { Badge, Shape } from './shapes.jsx'

const WORDS = ['idea', 'prototype', 'side hustle', 'class project', 'first sale']

// 32 tiles around the badge (3 × 11 on desktop; the first 8 make the 2 × 6 phone mosaic).
// Fixed, hand-mixed pattern: [shape, colour, turn, background colour or ''].
const TILES = [
  ['quarter', 'blue', 0, ''],
  ['circle', 'sky', 0, ''],
  ['leaf', 'midnight', 90, ''],
  ['square', 'ice', 0, ''],
  ['arch', 'cornflower', 0, 'ice'],
  ['triangle', 'white', 180, 'blue'],
  ['circle', 'white', 0, 'sky'],
  ['quarter', 'midnight', 270, ''],
  ['arch', 'sky', 180, ''],
  ['triangle', 'cornflower', 90, ''],
  ['square', 'white', 0, ''],
  ['leaf', 'sky', 0, 'midnight'],
  ['circle', 'blue', 0, ''],
  ['quarter', 'ice', 90, 'cornflower'],
  ['triangle', 'midnight', 0, ''],
  ['arch', 'white', 0, 'sky'],
  ['leaf', 'cornflower', 90, ''],
  ['square', 'sky', 0, ''],
  ['quarter', 'white', 180, 'blue'],
  ['circle', 'ice', 0, 'midnight'],
  ['triangle', 'sky', 270, ''],
  ['arch', 'blue', 90, ''],
  ['square', 'midnight', 0, ''],
  ['leaf', 'white', 0, 'cornflower'],
  ['circle', 'cornflower', 0, ''],
  ['quarter', 'sky', 0, 'ice'],
  ['triangle', 'blue', 90, 'white'],
  ['arch', 'midnight', 270, ''],
  ['circle', 'white', 0, 'blue'],
  ['leaf', 'ice', 90, ''],
  ['square', 'cornflower', 0, ''],
  ['quarter', 'midnight', 90, 'sky'],
]

// Desktop row of each tile: reading order around the badge (row 2, column 6).
const rowOf = (i) => Math.floor((i < 16 ? i : i + 1) / 11)

export function Hero({ ready }) {
  const ref = useRef(null)

  useSectionMotion(
    ref,
    ({ desktop, root, q }) => {
      if (!ready) return undefined

      // Entrance: headline lines rise out of their masks, tiles pop from the centre.
      const tiles = q('.l-tile').filter((t) => t.offsetWidth > 0)
      gsap
        .timeline({ delay: 0.1 })
        .from(q('.l-mask__in'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0)
        .from(q('.l-hero__lede, .l-hero__ctas'), { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.35)
        .from(
          tiles,
          { scale: 0, rotation: -20, duration: 0.6, ease: 'back.out(1.7)', stagger: { each: 0.03, from: 'center', grid: 'auto' } },
          0.25,
        )
        .from(q('.l-frame'), { opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.6)

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

      // Scroll: rows slide apart, the badge grows, the headline lifts away (phones: badge only).
      const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: SCRUB }
      gsap.to(q('.l-mosaic__badge-in'), { scale: 1.4, ease: 'none', scrollTrigger: scrub })
      if (desktop) {
        gsap.to(q('[data-row="0"]'), { x: -96, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('[data-row="2"]'), { x: 96, ease: 'none', scrollTrigger: scrub })
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

      <div className="l-mosaic" aria-hidden="true">
        <div className="l-frame">
          <span className="l-frame__line l-frame__line--top" />
          <span className="l-frame__line l-frame__line--bottom" />
          <span className="l-frame__line l-frame__line--left" />
          <span className="l-frame__line l-frame__line--right" />
          <span className="l-frame__label l-frame__label--tl">IDEAS</span>
          <span className="l-frame__label l-frame__label--tr">MENTORS</span>
          <span className="l-frame__label l-frame__label--bl">LESSONS</span>
          <span className="l-frame__label l-frame__label--br">PROGRESS</span>
        </div>
        <div className="l-mosaic__grid">
          {TILES.map(([kind, colour, turn, bg], i) => (
            <span
              key={i}
              className="l-tile"
              data-row={rowOf(i)}
              style={{ background: bg ? `var(--l-${bg})` : undefined, color: `var(--l-${colour})` }}
            >
              <Shape kind={kind} style={turn ? { transform: `rotate(${turn}deg)` } : undefined} />
            </span>
          ))}
          <span className="l-tile l-tile--badge">
            <span className="l-mosaic__badge-in">
              <Badge />
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}
