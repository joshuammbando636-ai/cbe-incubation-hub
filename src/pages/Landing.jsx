import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FlowGradient } from '../components/FlowGradient.jsx'
import { APP_NAME } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import './landing.css'

// Signed-out front page, rebuilt 16 Nov 2026 after CBE turned down the old one.
// Layout and motion follow Josh's davidecarusio.it spec (Lorem capture in
// D:\Lorem\Inspections\davidecarusio.it 2026-11-16 2125). Words and pictures are CBE's own;
// nothing from that site is used. The header is Josh's two-pill navbar, kept as it was.
// 1. Loader (first visit in a session): name wipes in, "every idea" → "needs a hub", sheet lifts.
// 2. Hero: Josh's blue-and-white FlowGradient (flows with the cursor), words right of centre,
//    the giant name at the bottom.
//    Dark bars grow over it as you scroll into…
// 3. Three statements on a deep-blue-to-white gradient with a dot grid; each one swallows the last.
// 4. How it works: four rows, picture left, words right. Hover: a blue panel wipes up, an arrow slides in.
// 5. The four stages: a big list; the picture on the left follows the stage you point at.
// 6. Questions: one answer open at a time, then a number to call.
// 7. Footer: three columns and the giant name again.
// Reduced motion: no loader, no smooth scroll, nothing moves, every word shows at once.

const CONTACT = { shown: '+255 627 375 912', tel: '+255627375912' }
const YEAR = new Date().getFullYear()
const WORDMARK = 'Incubation Hub'

const HERO_LINES = ['Turn your idea into a real business.', 'For CBE students who want more than a class project.']
const HERO_TEXT =
  'Join one of 22 innovation hubs, work with a mentor in your field and grow your business from idea to first sale, one stage at a time.'

const STATEMENTS = [
  'Why does a good idea need a hub?',
  'Most student ideas never leave the notebook.',
  'Here, yours gets a mentor, a path and a stage.',
]

// How it works. Pictures are CBE's drawings.
const STEPS = [
  {
    img: '/dashboard/spark-cut.webp',
    title: 'Join your hub',
    text: 'Sign up with the email you gave CBE. Your student details fill in by themselves.',
    tags: ['Sign up', 'CBE email'],
  },
  {
    img: '/dashboard/thinking-cut.webp',
    title: 'Describe your idea',
    text: 'Write your business down in plain words and pick the hub that fits it.',
    tags: ['22 hubs', 'One idea each'],
  },
  {
    img: '/dashboard/planning-cut.webp',
    title: 'Share your progress',
    text: 'Each time your business moves forward, post a short video link for your mentor.',
    tags: ['Video link', 'Mentor review'],
  },
  {
    img: '/dashboard/vision.webp',
    title: 'Move up a stage',
    text: 'When your mentor approves the video, you move to the next stage. Lessons and meetings help you get there.',
    tags: ['Lessons', 'Meetings'],
  },
]

const STAGES = [
  { name: 'Idea', img: '/dashboard/idea-bulb-cut.webp', text: 'Describe your business and pick the hub that fits it.' },
  { name: 'Prototype', img: '/dashboard/idea-carry-cut.webp', text: 'Build a first version with your mentor’s feedback.' },
  { name: 'Operational', img: '/landing/hub-hero.webp', photo: true, text: 'Open for customers and post your progress videos.' },
  { name: 'Earning', img: '/dashboard/spark.webp', text: 'Make your first sales and keep growing.' },
]

const FAQ = [
  ['Who can join?', 'Any student of the College of Business Education, on any campus.'],
  [
    'Which email should I use?',
    'The one you gave CBE when you registered. When you confirm it, your CBE details fill in by themselves.',
  ],
  ['I don’t have an idea yet. Can I still join?', 'Yes. Create your account now and add your idea when you have one.'],
  [
    'What is a hub?',
    'A group for one field, like FinTech, Agribusiness or Tourism. There are 22 hubs, and your mentor comes from yours.',
  ],
  [
    'How do I move up a stage?',
    'Post a short video link that shows your progress. Your mentor watches it; once it is approved, you move to the next stage.',
  ],
  ['Who can see my idea?', 'You, your hub’s mentors and the Incubation Hub administrators. Other students cannot.'],
]

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The loader plays once per browser session, never with reduced motion.
function shouldPlayLoader() {
  if (typeof window === 'undefined' || reduced()) return false
  try {
    return !window.sessionStorage.getItem('cbe-loader-seen')
  } catch {
    return true
  }
}

// ---------- Header: two pills (idea from butter.video) ----------
// Josh's navbar, kept as it was on 16 Nov 2026 (only the 4th link now points at the questions).
// Left: a grey pill with the logo, the section links and a ⋮ button. Once the page scrolls,
// its right edge slides in (one CSS variable, --offset), the links fade and ⋮ rides the edge.
// ⋮ opens a dropdown under the pill that unrolls with rounded corners.
// Right: a second pill with Sign in and a dark Join button.

const MENU = [
  ['#about', 'What we do', 'Our promise in one sentence'],
  ['#how', 'How it works', 'Four steps from sign-up'],
  ['#stages', 'The four stages', 'From idea to income'],
  ['#faq', 'Questions', 'Answers before you join'],
]

const LINKS = [
  ['#about', 'About'],
  ['#how', 'How it works'],
  ['#stages', 'Stages'],
  ['#faq', 'FAQ'],
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

// ---------- Small parts ----------

// Two stacked copies of a label; on hover the letters roll up one after another (CSS only).
function Swap({ text }) {
  const row = (extra) => (
    <span className={`dc-swap__row${extra}`} aria-hidden="true">
      {[...text].map((c, i) => (
        <span key={i} style={{ '--i': i }}>
          {c === ' ' ? '\u00a0' : c}
        </span>
      ))}
    </span>
  )
  return (
    <span className="dc-swap">
      <span className="visually-hidden">{text}</span>
      {row('')}
      {row(' dc-swap__row--in')}
    </span>
  )
}

function Arrow({ up = false }) {
  return (
    <svg className="dc-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {up ? <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /> : <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />}
    </svg>
  )
}

// The site's name in Funnel Display (the display font davidecarusio.it loads), sized to fill
// the width of its box exactly. Each word is its own piece so the two can drift apart.
function Wordmark({ className }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const text = ref.current
    const box = text.parentElement
    const fit = () => {
      text.style.fontSize = '100px'
      const w = text.getBoundingClientRect().width
      if (w) text.style.fontSize = `${(100 * box.clientWidth * 0.995) / w}px`
    }
    fit()
    document.fonts?.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={className} aria-hidden="true">
      <span ref={ref} className="dc-wordmark">
        {WORDMARK.split(' ').map((word, i) => (
          <Fragment key={word}>
            {i > 0 && ' '}
            <span className="dc-wordmark__word">{word}</span>
          </Fragment>
        ))}
      </span>
    </div>
  )
}

// A small label that follows the pointer over rows marked data-cursor-hover (mouse only).
function Cursor() {
  const ref = useRef(null)
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined
    const c = ref.current
    const bubble = c.firstChild
    const xTo = gsap.quickTo(c, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(c, 'y', { duration: 0.4, ease: 'power3.out' })
    let raf = 0
    let x = -100
    let y = -100
    const check = () => {
      raf = 0
      const under = document.elementFromPoint(x, y)
      const hit = under?.closest('[data-cursor-hover]')
      if (!hit) {
        c.dataset.cursor = ''
        return
      }
      bubble.textContent = hit.dataset.cursorText || ''
      c.dataset.cursor = x + bubble.offsetWidth + 40 > window.innerWidth ? 'active-edge' : 'active'
      c.dataset.cursorTheme = under.closest('[data-cursor-image]') ? 'on-image' : 'off-image'
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    const move = (e) => {
      x = e.clientX
      y = e.clientY
      xTo(x)
      yTo(y)
      queue()
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', queue, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', queue)
      cancelAnimationFrame(raf)
      gsap.killTweensOf(c)
    }
  }, [])
  return (
    <div ref={ref} className="dc-cursor" aria-hidden="true">
      <span className="dc-cursor__bubble" />
    </div>
  )
}

// Dot grid behind the statements. With a mouse, dots near the pointer grow and turn light blue.
function Dots() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    if (!ctx) return undefined
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced()
    const state = { hover: 0 }
    const pointer = { x: -9999, y: -9999 }
    let w = 0
    let h = 0
    let em = 16
    let down = false
    let visible = false
    let raf = 0

    const draw = () => {
      raf = 0
      ctx.clearRect(0, 0, w, h)
      const gap = 3 * em
      const size = 0.125 * em * 1.6
      const radius = 10 * em
      const max = 1.75 * (down ? 1.5 : 1)
      const ox = (w % gap) / 2
      const oy = (h % gap) / 2
      for (let x = ox; x <= w; x += gap) {
        for (let y = oy; y <= h; y += gap) {
          const d = Math.hypot(x - pointer.x, y - pointer.y)
          const k = Math.max(0, 1 - d / radius) * state.hover
          const s = size * (1 + (max - 1) * k)
          // white (255,255,255) at 22% → light blue (96,165,250) at full strength
          const r = Math.round(255 + (96 - 255) * k)
          const g = Math.round(255 + (165 - 255) * k)
          const b = Math.round(255 + (250 - 255) * k)
          ctx.fillStyle = `rgba(${r},${g},${b},${0.22 + 0.78 * k})`
          ctx.fillRect(x - s / 2, y - s / 2, s, s)
        }
      }
    }
    const queue = () => {
      if (!raf && visible) raf = requestAnimationFrame(draw)
    }
    const resize = () => {
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = w
      cv.height = h
      em = parseFloat(getComputedStyle(cv).fontSize) || 16
      queue()
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      queue()
    })
    io.observe(cv)
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    if (!fine) return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
    }

    const toHover = (v) => gsap.to(state, { hover: v, duration: 0.9, ease: 'power4.out', overwrite: true, onUpdate: queue })
    const move = (e) => {
      const r = cv.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= r.width && pointer.y <= r.height
      if (inside !== state.inside) {
        state.inside = inside
        toHover(inside ? 1 : 0)
      }
      queue()
    }
    const press = (v) => () => {
      down = v
      queue()
    }
    const onDown = press(true)
    const onUp = press(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
      gsap.killTweensOf(state)
    }
  }, [])
  return <canvas ref={ref} className="dc-dots" aria-hidden="true" />
}

// ---------- Sections ----------

function Loader() {
  return (
    <div className="dc-loader" aria-hidden="true">
      <div className="dc-loader__bg">
        <div className="dc-loader__bar" />
      </div>
      <div className="dc-loader__container">
        <div className="dc-loader__logo">
          <span className="is-base">{APP_NAME}</span>
          <span className="is-top">{APP_NAME}</span>
        </div>
        <div className="dc-loader__words">
          <span className="dc-loader__word">every idea</span>
          <span className="dc-loader__word">needs a hub</span>
        </div>
      </div>
    </div>
  )
}

function Hero({ coarse }) {
  return (
    <section id="top" className="dc-hero" tabIndex={-1} data-shutter data-shutter-start="top top">
      <div className="dc-hero__bg">
        <FlowGradient maxDpr={coarse ? 0.5 : 1.25} />
      </div>
      <div className="dc-hero__inner dc-container">
        <div className="dc-hero__copy">
          <div className="dc-hero__text">
            <h1 className="dc-hero__lead" data-hero="lines">
              {HERO_LINES[0]} <span>{HERO_LINES[1]}</span>
            </h1>
            <p className="dc-hero__lead dc-hero__sub" data-hero="lines">
              {HERO_TEXT}
            </p>
            <div className="dc-hero__cta" data-hero="cta">
              <Link to="/signup" className="dc-btn">
                <Swap text="Create your account" />
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
        <div className="dc-hero__foot">
          <p className="dc-mono dc-hero__eyebrow" data-hero="eyebrow">
            College of Business Education
          </p>
          <div className="dc-rule dc-hero__rule" />
          <Wordmark className="dc-hero__mark" />
        </div>
      </div>
    </section>
  )
}

function Statements() {
  return (
    <section id="about" className="dc-statements" aria-label="What we do">
      <div className="dc-statements__inner">
        <Dots />
        <div className="dc-statements__stack">
          {STATEMENTS.map((line) => (
            <h2 key={line} className="dc-statements__line">
              {line}
            </h2>
          ))}
        </div>
      </div>
    </section>
  )
}

function Label({ children, id }) {
  return (
    <div className="dc-label">
      <h2 id={id} className="dc-label__text">
        {children}
      </h2>
      <div className="dc-rule" />
    </div>
  )
}

// Hover (mouse): a light-blue panel wipes up behind the drawing, the drawing lifts a little
// and an arrow slides in beside the title. No videos (Josh, 16 Nov 2026).
function Step({ step, index }) {
  return (
    <Link to="/signup" className="dc-step" data-cursor-hover data-cursor-text="Get started">
      <div className="dc-step__media" data-cursor-image>
        <div className="dc-step__pic">
          <img src={step.img} alt="" loading="lazy" decoding="async" data-parallax />
        </div>
      </div>
      <div className="dc-step__body">
        <span className="dc-mono dc-step__num">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="dc-step__title">
          {step.title}
          <Arrow />
        </h3>
        <p className="dc-step__text">{step.text}</p>
        <ul className="dc-tags" aria-label="Good to know">
          {step.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </Link>
  )
}

function Steps() {
  return (
    <section id="how" className="dc-steps" aria-labelledby="how-title">
      <div className="dc-container">
        <Label id="how-title">How it works</Label>
        <div className="dc-steps__list">
          {STEPS.map((step, i) => (
            <Step key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Stages() {
  const [active, setActive] = useState(0)
  return (
    <section id="stages" className="dc-stages" aria-labelledby="stages-title">
      <div className="dc-container">
        <Label id="stages-title">The four stages</Label>
        <div className="dc-stages__grid">
          <div className="dc-stages__side">
            <div className="dc-stages__media">
              {STAGES.map((s, i) => (
                <img
                  key={s.name}
                  src={s.img}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`${s.photo ? 'is-photo' : ''}${i === active ? ' is-active' : ''}`}
                />
              ))}
            </div>
            <p className="dc-stages__desc" aria-live="polite">
              {STAGES[active].text}
            </p>
          </div>
          <ul className="dc-stages__list">
            {STAGES.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  className={`dc-stages__item${i === active ? ' is-active' : ''}`}
                  aria-pressed={i === active}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="dc-stages__slogan" data-highlight>
          One hub, one mentor, one clear path. Your idea, your videos and your mentor’s feedback stay together, so you
          always know what to do next.
        </p>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(-1)
  return (
    <section id="faq" className="dc-faq" aria-labelledby="faq-label">
      <div className="dc-container">
        <Label id="faq-label">Questions</Label>
        <h2 className="dc-faq__title" data-split="lines">
          Questions students
          <br />
          ask us most.
        </h2>
        <div className="dc-faq__list">
          {FAQ.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q} className={`dc-faq__item${isOpen ? ' is-open' : ''}`}>
                <h3 className="dc-faq__q">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{q}</span>
                    <span className="dc-faq__plus" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="dc-faq__a" inert={!isOpen}>
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="dc-faq__more">
          <p className="dc-faq__more-title">
            Still have a question?
            <br />
            <span>Give us a call.</span>
          </p>
          <a href={`tel:${CONTACT.tel}`} className="dc-btn dc-btn--light">
            <Swap text={`Call ${CONTACT.shown}`} />
            <Arrow />
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer({ toTop }) {
  return (
    <footer className="dc-footer" data-footer-parallax>
      <div className="dc-footer__inner">
        <div className="dc-footer__cols">
          <div>
            <h2 className="dc-mono dc-footer__label">Explore</h2>
            <ul className="dc-footer__links">
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#stages">The stages</a>
              </li>
              <li>
                <a href="#faq">Questions</a>
              </li>
            </ul>
            <button type="button" className="dc-footer__top" onClick={toTop}>
              Back to top <Arrow up />
            </button>
          </div>
          <div>
            <h2 className="dc-mono dc-footer__label">Your account</h2>
            <ul className="dc-footer__links">
              <li>
                <Link to="/login">Sign in</Link>
              </li>
              <li>
                <Link to="/signup">Create an account</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="dc-mono dc-footer__label">Contact</h2>
            <ul className="dc-footer__links">
              <li>
                <a href={`tel:${CONTACT.tel}`}>
                  Call us <Arrow />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="dc-mono dc-footer__bar">
          <span>© {YEAR} College of Business Education</span>
          <span>Incubation Hub</span>
        </div>
        <Wordmark className="dc-footer__mark" />
      </div>
      <div className="dc-footer__shade" aria-hidden="true" />
    </footer>
  )
}

// ---------- Motion ----------
// Everything runs inside one gsap.context, so leaving the page removes every trigger and split.

function useMotion(root, withLoader, lenisRef) {
  useLayoutEffect(() => {
    const el = root.current
    const html = document.documentElement
    html.classList.add('dc-root')
    if (reduced()) {
      el.classList.remove('is-pre')
      return () => html.classList.remove('dc-root')
    }

    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)
    CustomEase.create('loader', '0.85, 0, 0.15, 1')

    const lenis = new Lenis({ anchors: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    if (withLoader) lenis.stop()

    let dead = false
    let mm = null
    const ctx = gsap.context(() => {}, el)

    const build = () => {
      if (dead) return
      ctx.add(() => {
        el.classList.remove('is-pre')

        // Hero on arrival: the words rise one after another out of their lines, the button
        // comes up, the rule draws, and the big name fades up slowly while its two words ease
        // outward into place.
        const heroSplits = gsap.utils
          .toArray('[data-hero="lines"]')
          .map((n) => SplitText.create(n, { type: 'lines,words', mask: 'lines', linesClass: 'dc-line' }))
        const eyebrow = SplitText.create('[data-hero="eyebrow"]', { type: 'lines', mask: 'lines' })
        const [markFirst, markLast] = gsap.utils.toArray('.dc-hero__mark .dc-wordmark__word')
        const hero = gsap.timeline({
          paused: true,
          onComplete: () => heroSplits.forEach((s) => s.revert()),
        })
        hero
          .from(
            heroSplits.flatMap((s) => s.words),
            { yPercent: 110, duration: 1.1, stagger: 0.03, ease: 'expo.out' },
            0.15,
          )
          .from('[data-hero="cta"]', { autoAlpha: 0, y: '1.5em', duration: 1, ease: 'expo.out' }, 0.9)
          .from(eyebrow.lines, { opacity: 0, y: '1em', duration: 0.6, ease: 'power2.inOut', stagger: 0.1 }, 0.2)
          .from('.dc-hero__rule', { scaleX: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2)
          .from('.dc-hero__mark', { autoAlpha: 0, y: 64, duration: 2.6, ease: 'power3.out' }, 0.1)
          // xPercent here, x on scroll below: GSAP adds the two, so they never fight.
          .from(markFirst, { xPercent: 4, duration: 2.6, ease: 'power3.out' }, 0.1)
          .from(markLast, { xPercent: -10, duration: 2.6, ease: 'power3.out' }, 0.1)

        // The big name's two words keep drifting apart as you scroll off the hero
        // (his site: 4em each way, smoothed 0.8s); the footer's come together as it arrives.
        gsap
          .timeline({
            scrollTrigger: { trigger: '.dc-hero__mark', start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: 0.8 },
          })
          .fromTo(markFirst, { x: 0 }, { x: '-4rem', ease: 'none' }, 0)
          .fromTo(markLast, { x: 0 }, { x: '4rem', ease: 'none' }, 0)
        const [footFirst, footLast] = gsap.utils.toArray('.dc-footer__mark .dc-wordmark__word')
        gsap
          .timeline({
            scrollTrigger: { trigger: '.dc-footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
          })
          .fromTo('.dc-footer__mark .dc-wordmark', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.5 }, 0)
          .fromTo(footFirst, { x: '-4rem' }, { x: 0, ease: 'none', duration: 1 }, 0)
          .fromTo(footLast, { x: '4rem' }, { x: 0, ease: 'none', duration: 1 }, 0)

        // Loader: bar fills while the name wipes in; two words swap at the bottom; the sheet lifts.
        if (withLoader) {
          try {
            window.sessionStorage.setItem('cbe-loader-seen', '1')
          } catch {
            /* private window: the loader just plays again next time */
          }
          const words = gsap.utils
            .toArray('.dc-loader__word')
            .map((n) => SplitText.create(n, { type: 'lines,chars', mask: 'lines' }))
          gsap.set(
            words.flatMap((w) => w.chars),
            { autoAlpha: 0, yPercent: 125 },
          )
          const tl = gsap.timeline({ defaults: { ease: 'loader', duration: 3 }, onComplete: () => lenis.start() })
          tl.to('.dc-loader__bar', { scaleX: 1 })
            .to('.dc-loader__logo .is-top', { clipPath: 'inset(0% 0% 0% 0%)' }, '<')
            .to('.dc-loader__container', { autoAlpha: 0, duration: 0.5 })
            .to('.dc-loader__bar', { scaleX: 0, transformOrigin: 'right center', duration: 0.5 }, '<')
            .add('hide', '<')
            .to('.dc-loader__bg', { yPercent: -101, duration: 1 }, 'hide')
            .call(() => hero.play(), [], 'hide+=0.5')
            .set('.dc-loader', { display: 'none' })
          const [first, second] = words
          tl.to(first.chars, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: { each: 0.02 } }, 0)
            .to(first.chars, { autoAlpha: 0, yPercent: -125, duration: 0.4, stagger: { each: 0.02 } }, '>+=0.4')
            .to(second.chars, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: { each: 0.02 } }, '<')
            .to(second.chars, { autoAlpha: 0, yPercent: -125, duration: 0.4, stagger: { each: 0.02 } }, '>+=0.4')
        } else {
          hero.play()
        }

        // Hero drifts down as you scroll off it.
        gsap.fromTo(
          '.dc-hero__inner',
          { yPercent: 0 },
          {
            yPercent: 40,
            ease: 'none',
            scrollTrigger: { trigger: '.dc-hero', start: 'clamp(top top)', end: 'clamp(bottom top)', scrub: true },
          },
        )

        // Headings rise line by line out of a mask as they come into view.
        gsap.utils.toArray('[data-split]').forEach((heading) => {
          SplitText.create(heading, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'dc-line',
            onSplit: (s) =>
              gsap.from(s.lines, {
                yPercent: 110,
                duration: 0.8,
                stagger: 0.08,
                ease: 'expo.out',
                scrollTrigger: { trigger: heading, start: 'clamp(top 80%)', once: true },
              }),
          })
        })

        // Letters light up one by one as you scroll through the line.
        gsap.utils.toArray('[data-highlight]').forEach((line) => {
          SplitText.create(line, {
            type: 'words, chars',
            autoSplit: true,
            onSplit: (s) =>
              gsap.from(s.chars, {
                opacity: 0.2,
                stagger: 0.1,
                ease: 'none',
                scrollTrigger: { trigger: line, start: 'top 90%', end: 'center 40%', scrub: true },
              }),
          })
        })

        // Statements: each line fades in letter by letter, then is swallowed from its end as the
        // next one arrives; the words turn navy as the background turns white.
        const wrap = el.querySelector('.dc-statements')
        const lines = gsap.utils.toArray('.dc-statements__line')
        const master = gsap.timeline({
          scrollTrigger: { trigger: wrap, start: 'top 40%', end: 'bottom bottom', scrub: true },
        })
        lines.forEach((line, i) => {
          const s = SplitText.create(line, { type: 'words,chars' })
          const t = gsap.timeline()
          t.from(s.chars, { autoAlpha: 0, stagger: { amount: 0.7, from: 'start' }, duration: 0.7 })
          if (i < lines.length - 1) t.to(s.chars, { autoAlpha: 0, stagger: { amount: 0.7, from: 'end' }, duration: 0.7 })
          if (i === 0) master.add(t)
          else master.add(t, '-=0.15')
        })
        const ink = getComputedStyle(el).getPropertyValue('--dc-ink').trim()
        master.to(
          '.dc-statements__stack',
          { color: ink, ease: 'none', duration: master.duration() * 0.3 },
          master.duration() * 0.5,
        )

        // Pictures in the rows drift inside their frames (not on phones).
        mm = gsap.matchMedia()
        mm.add('(min-width: 768px)', () => {
          gsap.utils.toArray('[data-parallax]').forEach((img) => {
            gsap.fromTo(
              img,
              { yPercent: 8 },
              {
                yPercent: -8,
                ease: 'none',
                scrollTrigger: { trigger: img.parentElement, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: true },
              },
            )
          })
        })

        // Dark bars grow up over a light section as the dark one below arrives.
        mm.add(
          { desk: '(min-width: 992px)', tab: '(min-width: 768px) and (max-width: 991px)', phone: '(max-width: 767px)' },
          (c) => {
            const count = c.conditions.desk ? 16 : c.conditions.tab ? 10 : 6
            const panels = gsap.utils.toArray('[data-shutter]').map((section) => {
              const panel = document.createElement('div')
              panel.className = 'dc-shutter'
              panel.setAttribute('aria-hidden', 'true')
              for (let i = 0; i < count; i += 1) panel.append(document.createElement('div'))
              section.append(panel)
              gsap.set(panel.children, { scaleY: 0, transformOrigin: 'center bottom' })
              gsap.timeline({
                scrollTrigger: {
                  trigger: panel,
                  start: section.dataset.shutterStart || 'top top',
                  end: 'bottom top',
                  scrub: true,
                },
              }).to(panel.children, { scaleY: 1, duration: 0.1, stagger: { each: 0.01, from: 'end' }, ease: 'none' })
              return panel
            })
            return () => panels.forEach((p) => p.remove())
          },
        )

        // Footer slides up from under the page above, lightening as it comes.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.dc-footer',
              start: 'clamp(top bottom)',
              end: 'clamp(top top)',
              scrub: true,
            },
          })
          .from('.dc-footer__inner', { yPercent: -25, ease: 'none' })
          .from('.dc-footer__shade', { opacity: 0.5, ease: 'none' }, '<')

        ScrollTrigger.refresh()
      })
    }

    // Split only once the fonts are in, so the lines break where they will stay
    // (gives up waiting after 2 seconds on a slow connection).
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('600 16px "Geist Variable"'),
          document.fonts.load('600 16px "Geist Mono Variable"'),
          document.fonts.load('800 16px "Funnel Display Variable"'),
        ])
      : Promise.resolve()
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2000))])
      .catch(() => {})
      .then(build)

    return () => {
      dead = true
      mm?.revert()
      ctx.revert()
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
      html.classList.remove('dc-root')
    }
  }, [root, withLoader, lenisRef])
}

// ---------- Page ----------

export function Landing() {
  useTitle('')
  const root = useRef(null)
  const lenis = useRef(null)
  const [withLoader] = useState(shouldPlayLoader)
  const [motion] = useState(() => typeof window !== 'undefined' && !reduced())
  const [coarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches,
  )
  useMotion(root, withLoader, lenis)

  const toTop = () => {
    if (lenis.current) lenis.current.scrollTo(0, { lerp: 0.1 })
    else window.scrollTo({ top: 0 })
    document.getElementById('top')?.focus({ preventScroll: true })
  }

  return (
    <div ref={root} className={`home dc${motion ? ' is-pre' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {withLoader && <Loader />}
      <Cursor />
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero coarse={coarse} />
        <Statements />
        <Steps />
        <Stages />
        <Faq />
      </main>
      <Footer toTop={toTop} />
    </div>
  )
}
