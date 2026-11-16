import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Lightbulb,
  MessageCircle,
  Phone,
  Rocket,
  Route,
  TrendingUp,
  UserRound,
  Video,
  Wrench,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { APP_NAME, FOOTER } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

// Signed-out front page. Smooth scrolling with Lenis (computers; off with reduced motion).
// Header and hero follow butter.video's layout (Josh, 16 Nov 2026): two pills at the top,
// a light grey hero with open space and one cut-out drawing at the top, one big centred line.
// 1. Hero: "Every idea needs a hub." (letters sharpen out of a blur), a short line, Get started.
// 2. A statement with small icons in the sentence; its words light up as you scroll.
// 3. Two rows of hub names that slide sideways as you scroll.
// 4. "Turn your [word] into a business." with the buttons.
// 5. How it works: rows with a circled number, the drawing, one line and a huge word whose
//    letters flow up with the scroll (brancon.vercel.app style). No cards.
// 6. The stages: an open timeline; a playhead moves along a ruler as you scroll and
//    lights up the stage it is on (computers). Phones: a plain list.
// 7. Inside the hub: big heading left, a typed list of the student's tools right.
// 8. Ready to start: words and buttons beside a cut-out drawing (no card).
// The page above the footer ends in rounded corners; the footer is grey with columns and the
// name huge across the bottom in Some Time Later (Josh's logo font), like butter.video.
// Headings come in word by word. Ideas for the motion taken from butter.video (Lorem capture,
// 16 Nov 2026); words, colours and pictures are CBE's own.
// Reduced motion: everything shows at once, nothing moves.

const WORDS = ['idea', 'side hustle', 'prototype', 'class project', 'first sale']

// Hub names for the sliding rows (short names from supabase/schema.sql, " Hub" dropped).
const HUBS = [
  'FinTech Innovation',
  'Artificial Intelligence',
  'E-Commerce & Digital Marketing',
  'Agribusiness Innovation',
  'Smart Logistics',
  'Software Development',
  'Startup Ideation & Development',
  'Tourism & Hospitality Tech',
  'Business Analytics',
  'Cybersecurity & Risk',
  'Accounting Tech',
  'Data Science & Analytics',
  'Business Scale-Up',
  'Tax & RegTech',
  'E-Procurement',
  'E-Government Innovation',
  'Digital Metrology & Quality',
  'Digital Records & Archives',
  'HR Tech',
  'Operations & Productivity',
  'Event Tech',
  'Measurement & Automation',
]

// How it works: [picture, title, text].
const STEPS = [
  ['/dashboard/spark-cut.webp', 'Join', 'Sign up with your email. Your CBE details fill in by themselves.'],
  ['/dashboard/thinking-cut.webp', 'Describe', 'Add your business idea and pick the hub that fits it.'],
  ['/dashboard/planning-cut.webp', 'Share', 'Post a short video each time your business moves forward.'],
  ['/dashboard/vision.webp', 'Grow', 'Your mentor approves it, and you move up to the next stage.'],
]

const STAGES = [
  [Lightbulb, 'Idea', 'Describe your business and pick the hub that fits it.'],
  [Wrench, 'Prototype', 'Build a first version with your mentor’s feedback.'],
  [Rocket, 'Operational', 'Open for customers and post your progress videos.'],
  [TrendingUp, 'Earning', 'Make your first sales and keep growing.'],
]

// The statement: plain words, or [Icon] placed inside the sentence.
const STATEMENT = [
  'We', 'help', 'CBE', 'students', 'turn', Lightbulb, 'ideas', 'into', 'real', Rocket, 'businesses,',
  'with', 'a', UserRound, 'mentor', 'in', 'their', 'field', 'and', 'a', 'clear', Route, 'path.',
]

// Contact number for questions (Josh, 15 Nov 2026).
const CONTACT = { shown: '+255 627 375 912', tel: '+255627375912' }

const YEAR = new Date().getFullYear()

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Header: two pills (idea from butter.video) ----------
// Left: a grey pill with the logo, the section links and a ⋮ button. Once the page scrolls,
// its right edge slides in (one CSS variable, --offset), the links fade and ⋮ rides the edge.
// ⋮ opens a dropdown under the pill that unrolls with rounded corners.
// Right: a second pill with Sign in and a dark Join button.

const MENU = [
  ['#about', 'What we do', 'Our promise in one sentence'],
  ['#how', 'How it works', 'Four steps from sign-up'],
  ['#stages', 'The four stages', 'From idea to income'],
  ['#inside', 'Inside the hub', 'Your dashboard and your mentor'],
]

const LINKS = [
  ['#about', 'About'],
  ['#how', 'How it works'],
  ['#stages', 'Stages'],
  ['#inside', 'Inside'],
]

function Nav() {
  const [open, setOpen] = useState(false)
  const header = useRef(null)
  const inner = useRef(null)
  const links = useRef(null)
  const button = useRef(null)
  const panel = useRef(null)

  // Shrink the left pill once the page has scrolled; grow it back near the top or while the menu is open.
  useEffect(() => {
    const el = inner.current
    let shut = null
    const offsetFor = (c) => {
      const nav = links.current
      if (!c || !nav.offsetWidth) return '0px'
      return `${nav.offsetWidth + parseFloat(getComputedStyle(nav).marginLeft)}px`
    }
    const update = (force) => {
      const c = window.scrollY > 80 && !el.closest('.b-nav').classList.contains('is-open')
      if (c === shut && !force) return
      shut = c
      el.classList.toggle('is-shut', c)
      const offset = offsetFor(c)
      if (reduced() || force === 'now') {
        gsap.set(el, { '--offset': offset })
      } else {
        gsap.to(el, { '--offset': offset, duration: 0.5, ease: 'power2.inOut', overwrite: true })
      }
    }
    const onScroll = () => update(false)
    const onResize = () => update('now')
    update('now')
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    el.addEventListener('menuchange', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('menuchange', onScroll)
    }
  }, [])

  // The header fades in once, after the page has drawn.
  useLayoutEffect(() => {
    if (reduced()) return undefined
    const tween = gsap.from(header.current, { opacity: 0, y: -12, duration: 0.8, ease: 'power2.out', delay: 0.15 })
    return () => tween.revert()
  }, [])

  useEffect(() => {
    inner.current?.dispatchEvent(new Event('menuchange'))
    if (!open) return undefined
    panel.current?.querySelector('a')?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header ref={header} className={`b-nav${open ? ' is-open' : ''}`}>
      <div className="b-nav__catch" onClick={close} aria-hidden="true" />
      <div className="b-nav__left">
        <div ref={inner} className="b-nav__inner">
          <Link to="/" className="b-nav__logo" aria-label={`${APP_NAME}, home`}>
            <span className="h-nav__mark" aria-hidden="true">
              CBE
            </span>
            <span className="b-nav__name">Incubation Hub</span>
          </Link>
          <nav ref={links} className="b-nav__links" aria-label="Sections">
            {LINKS.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <button
            ref={button}
            type="button"
            className="b-nav__toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
        <nav id="site-menu" ref={panel} className="b-nav__drop" aria-label="Site" data-open={open || undefined}>
          {MENU.map(([href, label, note]) => (
            <a key={href} href={href} onClick={close} className="b-nav__item">
              <span className="b-nav__item-name">{label}</span>
              <span className="b-nav__item-note">{note}</span>
            </a>
          ))}
          <a href={`tel:${CONTACT.tel}`} onClick={close} className="b-nav__item">
            <span className="b-nav__item-name">Call us</span>
            <span className="b-nav__item-note">{CONTACT.shown}</span>
          </a>
        </nav>
      </div>
      <div className="b-nav__right">
        <Link to="/login" className="b-nav__signin">
          Sign in
        </Link>
        <Link to="/signup" className="b-nav__join">
          Join
        </Link>
      </div>
    </header>
  )
}

// ---------- Hero (layout from butter.video): light grey gradient, open space at the top with
// one cut-out drawing, one big centred line, a short line and one button.
// The motion lives in the words: letters sharpen out of a blur as the page opens,
// and the words drift apart at different speeds as you scroll away. ----------

// Picture above the headline (background removed). Set to null to leave the space empty.
const HERO_IMAGE = '/dashboard/idea-bulb-cut.webp'

const HERO_LINE = 'Every idea needs a hub.'

// The headline split into words and letters. Screen readers hear the plain sentence once.
function Letters({ text }) {
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((word, i) => (
          <span key={i}>
            <span className="b-word">
              {[...word].map((ch, k) => (
                <span key={k} className="b-ch">
                  {ch}
                </span>
              ))}
            </span>{' '}
          </span>
        ))}
      </span>
    </>
  )
}

function Hero() {
  const root = useRef(null)

  useLayoutEffect(() => {
    if (reduced()) return undefined
    const el = root.current
    const mm = gsap.matchMedia()

    // Blur only where it stays smooth (bigger screens); phones get the same move without it.
    mm.add({ big: '(min-width: 768px)', small: '(max-width: 767px)' }, (context) => {
      const blur = (px) => (context.conditions.big ? `blur(${px}px)` : 'blur(0px)')
      gsap
        .timeline({ delay: 0.2 })
        .from('.b-ch', {
          yPercent: 55,
          opacity: 0,
          filter: blur(14),
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.035,
          clearProps: 'filter',
        })
        .from('.b-hero__img', { opacity: 0, y: 24, duration: 1.4, ease: 'power2.out' }, 0.1)
        .from('.b-hero__sub', { opacity: 0, filter: blur(8), duration: 1, ease: 'power2.out', clearProps: 'filter' }, 0.7)
        .from('.b-hero__cta', { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out' }, 0.9)

      // Scrolling away: each word lifts at its own speed, so the line comes apart as it leaves.
      gsap.to('.b-word', {
        yPercent: (i) => -40 - i * 35,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 15%', scrub: true },
      })
      gsap.to('.b-hero__art', {
        y: -120,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section className="b-hero" ref={root} aria-labelledby="hero-title">
      <div className="b-hero__art" aria-hidden="true">
        {HERO_IMAGE && <img className="b-hero__img" src={HERO_IMAGE} alt="" fetchPriority="high" />}
      </div>
      <div className="b-hero__copy">
        <h1 id="hero-title" className="b-hero__title">
          <Letters text={HERO_LINE} />
        </h1>
        <p className="b-hero__sub">The College of Business Education’s home for student businesses.</p>
        <Link to="/signup" className="b-hero__cta">
          Get started
        </Link>
      </div>
    </section>
  )
}

// ---------- Below the hero ----------

function Glyph({ icon: Icon }) {
  return <Icon strokeWidth={1.5} />
}

// A heading that comes in word by word. Screen readers hear the plain sentence once.
function Split({ lines }) {
  return (
    <>
      <span className="visually-hidden">{lines.join(' ')}</span>
      <span aria-hidden="true">
        {lines.map((line) => (
          <span key={line} className="h-line">
            {line.split(' ').map((w, i) => (
              <span key={i} className="h-wd">
                {w}{' '}
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  )
}

// Smooth scrolling on this page only, driven by GSAP's clock so ScrollTrigger stays in step.
// Touch screens keep their own scrolling (Lenis leaves touch alone by default).
function useSmoothScroll() {
  useEffect(() => {
    if (reduced()) return undefined
    const lenis = new Lenis({ anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])
}

function useBelowMotion(root) {
  useLayoutEffect(() => {
    if (reduced()) return undefined
    const el = root.current
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      // Statement: words light up one by one as the block scrolls through.
      gsap.fromTo(
        '.h-st__w',
        { opacity: 0.18 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: '.h-statement', start: 'top 75%', end: 'bottom 55%', scrub: 0.4 },
        },
      )

      // Rotating word: a new one every 1.4 s.
      const STEP = 1.4
      const words = gsap.utils.toArray('.h-word__item')
      gsap.set(words, { visibility: 'visible', yPercent: (i) => (i ? 110 : 0), opacity: (i) => (i ? 0 : 1) })
      const loop = gsap.timeline({ repeat: -1, delay: 1 })
      words.forEach((word, i) => {
        const next = words[(i + 1) % words.length]
        loop
          .to(word, { yPercent: -110, opacity: 0, duration: 0.45, ease: 'power3.inOut' }, i * STEP)
          .fromTo(next, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, i * STEP + 0.1)
      })

      // Everything marked [data-reveal] rises in once.
      gsap.utils.toArray('[data-reveal]').forEach((item) =>
        gsap.from(item, {
          y: 28,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 88%', once: true },
        }),
      )

      // Closing drawing drifts a little with the scroll.
      gsap.fromTo(
        '.h-final__pic',
        { y: 40 },
        { y: -40, ease: 'none', scrollTrigger: { trigger: '.h-final', start: 'top bottom', end: 'bottom top', scrub: true } },
      )

      // Hub rows: tied to the scroll, one slides left, the other right.
      const rows = { trigger: '.h-hubs', start: 'top bottom', end: 'bottom top', scrub: true }
      gsap.fromTo('.h-hubs__row--a', { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: rows })
      gsap.fromTo('.h-hubs__row--b', { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: rows })

      // How it works: the heading's second line fills in as you scroll to it.
      gsap.fromTo(
        '.h-how__line--fill',
        { opacity: 0.22 },
        { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.h-how__title', start: 'top 80%', end: 'top 35%', scrub: true } },
      )

      // Each row: the big word's letters flow up out of their line one after another, tied to
      // the scroll (they go back down when you scroll up); number, drawing and line fade in once.
      gsap.utils.toArray('.h-step').forEach((row) => {
        gsap.from(row.querySelectorAll('.h-step__ch'), {
          yPercent: 105,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: row, start: 'top 92%', end: 'top 50%', scrub: 0.6 },
        })
        gsap.from(row.querySelectorAll('.h-step__num, .h-step__pic, .h-step__text'), {
          opacity: 0,
          y: 16,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: row, start: 'top 85%', once: true },
        })
      })

      // Inside the hub: the tool rows come in one after another, once.
      gsap.from('.h-tools__row', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.h-tools', start: 'top 80%', once: true },
      })

      // Footer wordmark rises out of its line as the footer comes up.
      gsap.from('.h-footer__mark span', {
        yPercent: 100,
        ease: 'none',
        scrollTrigger: { trigger: '.h-footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
    }, el)

    // Headings marked [data-split]: words come out of a blur one after another, once (like
    // butter.video). Phones skip the blur so it stays smooth.
    mm.add({ big: '(min-width: 768px)', small: '(max-width: 767px)' }, (context) => {
      gsap.utils.toArray('[data-split]', el).forEach((heading) =>
        gsap.from(heading.querySelectorAll('.h-wd'), {
          opacity: 0,
          yPercent: 25,
          filter: context.conditions.big ? 'blur(14px)' : 'blur(0px)',
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.07,
          clearProps: 'filter',
          scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
        }),
      )
    })

    // Computers and tablets: the journey panel's playhead follows the scroll.
    mm.add('(min-width: 760px)', () => {
      const panel = el.querySelector('.h-tl')
      const track = panel.querySelector('.h-tl__ruler')
      const tiles = [...panel.querySelectorAll('.h-tl__tile')]
      const now = panel.querySelector('.h-tl__now')
      const plain = now.textContent
      let at = -1
      const show = (i) => {
        if (i === at) return
        at = i
        tiles.forEach((tile, k) => {
          tile.classList.toggle('is-on', k <= i)
          tile.classList.toggle('is-now', k === i)
        })
        now.textContent = `Stage ${i + 1} of 4 · ${STAGES[i][1]}`
      }
      panel.classList.add('is-live')
      show(0)
      gsap
        .timeline({
          onUpdate() {
            show(Math.min(3, Math.floor(this.progress() * 4)))
          },
          scrollTrigger: { trigger: panel, start: 'top 75%', end: 'bottom 30%', scrub: 0.6, invalidateOnRefresh: true },
        })
        .fromTo('.h-tl__head', { x: 0 }, { x: () => track.clientWidth, ease: 'none' }, 0)
        .fromTo('.h-tl__sel', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
      return () => {
        panel.classList.remove('is-live')
        tiles.forEach((tile) => tile.classList.remove('is-on', 'is-now'))
        now.textContent = plain
      }
    })

    // Inside the hub: hovering a tool row shows its clip in a rounded frame that follows the
    // pointer and tilts a little with the movement. Mouse only; phones and reduced motion skip it.
    mm.add('(hover: hover) and (pointer: fine)', () => {
      const list = el.querySelector('.h-tools')
      const peek = el.querySelector('.h-peek')
      const clips = [...peek.querySelectorAll('video')]
      const tag = peek.querySelector('.h-peek__tag')
      const rows = [...list.querySelectorAll('[data-peek]')]
      gsap.set(peek, { xPercent: -50, yPercent: -112, scale: 0.6, autoAlpha: 0 })
      const toX = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3' })
      const toY = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3' })
      const toR = gsap.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3' })
      let at = -1
      const show = (i) => {
        if (i === at) return
        at = i
        clips.forEach((clip, k) => {
          clip.classList.toggle('is-on', k === i)
          if (k === i) clip.play().catch(() => {})
          else clip.pause()
        })
        tag.textContent = TOOLS[i][1]
      }
      const move = (e) => {
        toX(e.clientX)
        toY(e.clientY)
        toR(gsap.utils.clamp(-8, 8, e.movementX * 0.5))
      }
      const enter = (e) => {
        gsap.set(peek, { x: e.clientX, y: e.clientY })
        gsap.to(peek, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
        window.addEventListener('pointermove', move)
      }
      const leave = () => {
        window.removeEventListener('pointermove', move)
        gsap.to(peek, {
          scale: 0.6,
          autoAlpha: 0,
          duration: 0.3,
          ease: 'power2.in',
          overwrite: 'auto',
          onComplete: () => {
            clips.forEach((clip) => clip.pause())
            at = -1
          },
        })
      }
      const over = rows.map((row) => {
        const onRow = () => show(Number(row.dataset.peek))
        row.addEventListener('pointerenter', onRow)
        return () => row.removeEventListener('pointerenter', onRow)
      })
      list.addEventListener('pointerenter', enter)
      list.addEventListener('pointerleave', leave)
      return () => {
        list.removeEventListener('pointerenter', enter)
        list.removeEventListener('pointerleave', leave)
        window.removeEventListener('pointermove', move)
        over.forEach((off) => off())
        clips.forEach((clip) => clip.pause())
      }
    })

    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [root])
}

function HubRows() {
  const half = Math.ceil(HUBS.length / 2)
  return (
    <section className="h-hubs" aria-labelledby="hubs-title">
      <p id="hubs-title" className="h-hubs__label">
        {HUBS.length} hubs. One for every kind of idea.
      </p>
      <ul className="h-hubs__row h-hubs__row--a">
        {HUBS.slice(0, half).map((hub) => (
          <li key={hub}>{hub}</li>
        ))}
      </ul>
      <ul className="h-hubs__row h-hubs__row--b">
        {HUBS.slice(half).map((hub) => (
          <li key={hub}>{hub}</li>
        ))}
      </ul>
    </section>
  )
}

// How it works, row style from brancon.vercel.app (Josh, 16 Nov 2026): a circled number,
// the drawing, one short line, and one huge word on the right whose letters flow up with the scroll.
function HowItWorks() {
  return (
    <section className="h-how" id="how" tabIndex={-1} aria-labelledby="how-title">
      <div className="h-wrap">
        <h2 id="how-title" className="h-how__title">
          <span className="visually-hidden">One place to grow your business.</span>
          <span aria-hidden="true">
            <span className="h-how__line">One place to grow</span>
            <span className="h-how__line h-how__line--fill">your business.</span>
          </span>
        </h2>
        <ol className="h-steps">
          {STEPS.map(([pic, title, text], i) => (
            <li key={title} className="h-step">
              <span className="h-step__num" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="h-step__word">
                <span className="visually-hidden">{title}</span>
                <span className="h-step__mask" aria-hidden="true">
                  {[...title].map((ch, k) => (
                    <span key={k} className="h-step__ch">
                      {ch}
                    </span>
                  ))}
                </span>
              </h3>
              <p className="h-step__text">{text}</p>
              <img className="h-step__pic" src={pic} alt="" loading="lazy" decoding="async" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Stages() {
  return (
    <section className="h-stages" id="stages" tabIndex={-1} aria-labelledby="stages-title">
      <div className="h-wrap">
        <p className="h-label">The stages</p>
        <h2 id="stages-title" className="h-title" data-split>
          <Split lines={['From idea to income,', 'one stage at a time.']} />
        </h2>
        <div className="h-tl">
          <div className="h-tl__top">
            <span className="h-tl__chip">
              <Route size={16} aria-hidden="true" /> Your journey
            </span>
            <span className="h-tl__now" aria-hidden="true">
              4 stages
            </span>
          </div>
          <div className="h-tl__ruler" aria-hidden="true">
            {STAGES.map((_, i) => (
              <span key={i} className="h-tl__mark" style={{ left: `${i * 25}%` }}>
                0{i + 1}
              </span>
            ))}
            <span className="h-tl__sel" />
            <span className="h-tl__head" />
          </div>
          <ol className="h-tl__tiles">
            {STAGES.map(([Icon, name, text]) => (
              <li key={name} className="h-tl__tile">
                <span className="h-tl__icon">
                  <Icon strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

// The student's tools, all real parts of the dashboard: [icon, name, what it is, hover clip].
// Clips: 3.5 s, silent, in public/landing/tools/<clip>.mp4 with a <clip>.webp still (cut from
// Josh's two videos in design-originals/). Swap a file to change what a row shows.
const TOOLS = [
  [Lightbulb, 'Idea', 'Your business, your hub and your stage', 'idea'],
  [Video, 'Progress', 'Short videos your mentor approves', 'progress'],
  [BookOpen, 'Lessons', 'Posted by the mentors in your hub', 'lessons'],
  [UserRound, 'Mentor', 'Someone who knows your field', 'mentor'],
  [CalendarDays, 'Meetings', 'Hub meetings, joined with one link', 'meetings'],
  [MessageCircle, 'Messages', 'Write to your mentor directly', 'messages'],
]

function Inside() {
  return (
    <section className="h-inside" id="inside" tabIndex={-1} aria-labelledby="inside-title">
      <div className="h-wrap h-inside__grid">
        <div className="h-inside__head">
          <h2 id="inside-title" className="h-title" data-split>
            <Split lines={['Your hub, your mentor', 'and your next step,', 'in one place.']} />
          </h2>
          <p className="h-inside__text" data-reveal>
            Students see their stage, their mentor and what to do next. Mentors see only the students in their hubs,
            review progress videos and post lessons.
          </p>
          <div data-reveal>
            <Link to="/signup" className="h-btn h-btn--primary">
              Create your account <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ul className="h-tools" aria-label="What students get">
          {TOOLS.map(([Icon, name, note], i) => (
            <li key={name} className="h-tools__row" data-peek={i}>
              <Icon className="h-tools__icon" strokeWidth={1.5} aria-hidden="true" />
              <span className="h-tools__name">{name}</span>
              <span className="h-tools__note">{note}</span>
            </li>
          ))}
        </ul>

        {/* Hover a row (computer with a mouse): a short clip pops up and follows the pointer. */}
        <div className="h-peek" aria-hidden="true">
          {TOOLS.map(([, name, , clip]) => (
            <video
              key={name}
              className="h-peek__clip"
              src={`/landing/tools/${clip}.mp4`}
              poster={`/landing/tools/${clip}.webp`}
              muted
              loop
              playsInline
              preload="none"
              tabIndex={-1}
            />
          ))}
          <span className="h-peek__tag" />
        </div>
      </div>
    </section>
  )
}

export function Landing() {
  useTitle('Welcome')
  const root = useRef(null)
  useSmoothScroll()
  useBelowMotion(root)

  return (
    <div className="home" ref={root}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />

      <main id="main" tabIndex={-1}>
        <Hero />

        <section className="h-statement" id="about" tabIndex={-1} aria-label="What we do">
          <p className="h-statement__text">
            {STATEMENT.map((part, i) =>
              typeof part === 'string' ? (
                <span key={i} className="h-st__w">
                  {part}{' '}
                </span>
              ) : (
                <span key={i} className="h-st__w h-st__icon" aria-hidden="true">
                  <Glyph icon={part} />{' '}
                </span>
              ),
            )}
          </p>
        </section>

        <HubRows />

        <section className="h-start">
          <div className="h-wrap">
            <h2 className="h-start__title" data-reveal>
              <span className="visually-hidden">Turn your idea into a business.</span>
              <span aria-hidden="true">
                Turn your{' '}
                <span className="h-word">
                  {WORDS.map((w) => (
                    <span key={w} className="h-word__item">
                      {w}
                    </span>
                  ))}
                </span>
                <br />
                into a business.
              </span>
            </h2>
            <div className="h-start__body" data-reveal>
              <p>
                Join an innovation hub at the College of Business Education, get a mentor in your field, and grow your
                business one stage at a time.
              </p>
              <div className="h-start__ctas">
                <Link to="/signup" className="h-btn h-btn--primary">
                  Create your account <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to="/login" className="h-btn h-btn--ghost">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Stages />
        <Inside />

        <section className="h-final" aria-labelledby="final-title">
          <div className="h-wrap h-final__grid">
            <div>
              <h2 id="final-title" className="h-final__title" data-split>
                <Split lines={['Ready to start', 'your business?']} />
              </h2>
              <p className="h-final__text" data-reveal>
                It takes one minute to create your account.
              </p>
              <div className="h-start__ctas" data-reveal>
                <Link to="/signup" className="h-btn h-btn--primary">
                  Create your account <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to="/login" className="h-btn h-btn--ghost">
                  Sign in
                </Link>
              </div>
            </div>
            <img className="h-final__pic" src="/dashboard/idea-carry-cut.webp" alt="" loading="lazy" decoding="async" />
          </div>
        </section>
      </main>

      {/* Footer (layout from butter.video): grey, columns with small labels and big links,
          and the name huge across the bottom in Josh's logo font. */}
      <footer className="h-footer">
        <div className="h-wrap">
          <div className="h-footer__cols">
            <div className="h-footer__brand">
              <p className="h-footer__logo">
                <span className="h-nav__mark" aria-hidden="true">
                  CBE
                </span>
                <span className="h-footer__name">Incubation Hub</span>
              </p>
              <p className="h-footer__line">Every idea needs a hub.</p>
            </div>
            <nav className="h-footer__col" aria-label="Explore">
              <p className="h-footer__head">Explore</p>
              <a href="#about">What we do</a>
              <a href="#how">How it works</a>
              <a href="#stages">The four stages</a>
              <a href="#inside">Inside the hub</a>
            </nav>
            <nav className="h-footer__col" aria-label="Your account">
              <p className="h-footer__head">Your account</p>
              <Link to="/signup">Create your account</Link>
              <Link to="/login">Sign in</Link>
            </nav>
            <div className="h-footer__col">
              <p className="h-footer__head">Questions</p>
              <a href={`tel:${CONTACT.tel}`}>
                <Phone size={18} aria-hidden="true" /> {CONTACT.shown}
              </a>
            </div>
          </div>
          <p className="h-footer__small">
            © {YEAR} {FOOTER}
          </p>
        </div>
        <p className="h-footer__mark" aria-hidden="true">
          <span>Incubation Hub</span>
        </p>
      </footer>
    </div>
  )
}
