import { ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gsap, onceVisible, prefersReducedMotion, SCRUB, useSectionMotion } from './motion.js'

const WORDS = ['idea', 'prototype', 'side hustle', 'class project', 'first sale']

// Section 1, the opening. On computers the section is pinned for one window of
// scrolling: the headline fades out, the round video picture drops 51px and
// zooms out from 2.06x to its normal size, both tied to the scroll (they go back
// when you scroll up). Phones: no pin, the parts simply show.
export function Journey({ ready }) {
  const ref = useRef(null)
  const video = useRef(null)
  const stopped = useRef(false)
  const [playing, setPlaying] = useState(false)

  // The video plays only while on screen; never by itself with reduced motion or Data Saver.
  useEffect(() => {
    const v = video.current
    if (!v || prefersReducedMotion() || navigator.connection?.saveData) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !stopped.current) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  const toggle = () => {
    const v = video.current
    if (v.paused) {
      stopped.current = false
      v.play().catch(() => {})
    } else {
      stopped.current = true
      v.pause()
    }
  }

  useSectionMotion(
    ref,
    ({ desktop, root, q }) => {
      if (!ready) return undefined

      // Entrance: headline lines rise out of their masks.
      gsap
        .timeline({ delay: 0.1 })
        .from(q('.l-mask__in'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0)
        .from(q('.f-journey__lede, .f-journey__ctas'), { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.35)

      // Rotating word: the old one slides up and fades, the new one rises from below.
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

      if (desktop) {
        const pinned = gsap.timeline({
          scrollTrigger: { trigger: root, start: 'top top', end: '+=100%', pin: true, scrub: SCRUB, anticipatePin: 1 },
        })
        pinned
          .fromTo(q('.f-journey__pic'), { y: 0, scale: 2.06 }, { y: 51, scale: 1, ease: 'none' }, 0)
          .to(q('.f-journey__head'), { opacity: 0, ease: 'none' }, 0)
      }
      return undefined
    },
    [ready],
  )

  return (
    <section className="f-journey" ref={ref} aria-labelledby="journey-title">
      <div className="f-journey__inner">
        <div className="f-journey__head">
          <h1 id="journey-title" className="l-hero__title f-office">
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
          <p className="f-journey__lede">
            Join an innovation hub, get a mentor in your field, and grow your business one stage at a time.
          </p>
        </div>

        <div className="f-journey__pic">
          <div className="f-journey__clip">
            <video
              ref={video}
              className="f-journey__video"
              poster="/landing/hub-video.webp"
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              <source src="/landing/hub-video.mp4" type="video/mp4" />
            </video>
          </div>
          <button type="button" className="f-journey__toggle" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'}>
            {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
        </div>

        <div className="f-journey__ctas">
          <Link to="/signup" className="f-arrow" aria-label="Create your account">
            <ArrowRight aria-hidden="true" size={26} />
          </Link>
          <Link to="/login" className="l-btn l-btn--ghost">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

// The wide card after the opening: a picture of a student with words over it.
// It fades in once, when it comes into view.
export function JourneyCard() {
  const ref = useRef(null)
  useSectionMotion(ref, ({ q }) => {
    const card = q('.f-card__box')
    gsap.set(card, { opacity: 0 })
    return onceVisible(card, (el) => gsap.to(el, { opacity: 1, duration: 0.2, ease: 'none' }))
  })
  return (
    <section className="f-card" ref={ref}>
      <div className="f-card__box">
        <img src="/landing/student-blur.webp" alt="" width="1600" height="1000" loading="lazy" />
        <div className="f-card__words">
          <p className="f-card__line">Every idea needs a hub.</p>
          <p className="f-card__sub">Students, mentors and lessons in one place, from first idea to first sale.</p>
        </div>
      </div>
    </section>
  )
}
