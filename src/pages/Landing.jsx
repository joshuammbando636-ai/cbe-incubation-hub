import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Lightbulb,
  MapPin,
  PlayCircle,
  ShieldCheck,
  UserPlus,
  Users,
  Video,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { STAGES } from '../lib/labels.js'
import { supabase } from '../lib/supabase.js'
import { APP_NAME, FOOTER } from '../lib/text.js'
import { useTitle } from '../lib/useTitle.js'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your account',
    text: 'Sign up with your email. Already registered with CBE? We fill in your details for you.',
  },
  {
    icon: ClipboardList,
    title: 'Join a hub',
    text: 'Complete your profile and choose the innovation hub that fits your idea. A mentor looks after each hub.',
  },
  {
    icon: Lightbulb,
    title: 'Tell us your idea',
    text: 'Describe your business, its sector and the stage it is at today.',
  },
  {
    icon: Video,
    title: 'Show your progress',
    text: 'Post a short video when you move forward. Your mentor watches it and moves you up a stage.',
  },
]

const FOR_STUDENTS = [
  'A mentor who knows your field',
  'Video lessons you can watch on your phone',
  'Meetings and notices from your hub',
  'A clear record of how far your business has come',
]

const FOR_MENTORS = [
  'Only the students in the hubs you run',
  'Approve progress videos in one tap',
  'Post lessons, meetings and notices',
  'Download your hub register as Excel',
]

const CAMPUSES = ['Dar es Salaam', 'Mwanza', 'Dodoma']

// Hubs and support types come from the database, so an admin's edits show here too.
function useList(table) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    let stale = false
    supabase
      .from(table)
      .select('id, name')
      .order('name')
      .then(({ data }) => !stale && setRows(data ?? []))
    return () => {
      stale = true
    }
  }, [table])
  return rows
}

// One motion system for the page: the hero plays once, everything else rises in as it scrolls into view.
function useLandingMotion(root) {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'expo.out', duration: 1 } })
          .from('[data-hero] > *', { y: 32, opacity: 0, stagger: 0.08 })
          .from('.journey', { y: 40, opacity: 0, duration: 1.1 }, '-=0.8')
          .from('.journey-step', { x: -12, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, '-=0.7')
          .from('.journey-fill', { scaleY: 0, duration: 1.2, ease: 'power3.inOut' }, '-=0.3')
          .from('.journey-badge', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')

        gsap.set('[data-reveal]', { y: 24, opacity: 0 })
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 88%',
          once: true,
          onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08 }),
        })
      })
    }, root)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [root])
}

export function Landing() {
  useTitle('Welcome')
  const root = useRef(null)
  const hubs = useList('hubs')
  const support = useList('support_types')
  useLandingMotion(root)

  return (
    <div className="landing" ref={root}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <Link to="/" className="site-brand">
          <span className="brand-mark" aria-hidden="true">
            CBE
          </span>
          <span>Incubation Hub</span>
        </Link>
        <nav className="site-nav" aria-label="Page">
          <a href="#how">How it works</a>
          <a href="#stages">Stages</a>
          <a href="#hubs">Hubs</a>
          <a href="#about">About</a>
        </nav>
        <div className="site-actions">
          <Link to="/login" className="site-signin">
            Sign in
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Join
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {/* Hero: the one big moment */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy" data-hero>
              <p className="eyebrow">College of Business Education · Incubation Hub</p>
              <h1 className="hero-title">Turn your idea into a business.</h1>
              <p className="hero-lede">
                Register your idea, join an innovation hub and get a mentor who helps you grow it, one stage at a time.
              </p>
              <div className="hero-ctas">
                <Link to="/signup" className="btn btn-white">
                  Create your account <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link to="/login" className="btn btn-ghost">
                  Sign in
                </Link>
              </div>
            </div>

            <figure className="journey" aria-label="Example: how a student moves through the four stages">
              <div className="journey-head">
                <span className="avatar" aria-hidden="true">
                  AJ
                </span>
                <div>
                  <p className="journey-name">Cold storage for fish traders</p>
                  <p className="journey-meta">Example · Smart Logistics Hub</p>
                </div>
              </div>
              <div className="journey-body">
              <span className="journey-track" aria-hidden="true">
                <span className="journey-fill" />
              </span>
              <ol className="journey-steps">
                {STAGES.map((s, i) => (
                  <li key={s.value} className={`journey-step${i < 2 ? ' is-done' : ''}${i === 2 ? ' is-now' : ''}`}>
                    <span className="journey-dot" aria-hidden="true" />
                    <span className="journey-label">{s.label}</span>
                    {i === 2 && (
                      <span className="journey-badge">
                        <BadgeCheck aria-hidden="true" size={16} /> Mentor verified
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              </div>
            </figure>
          </div>
        </section>

        {/* Facts */}
        <section className="band" aria-label="The hub in numbers">
          <dl className="facts-row">
            <div data-reveal>
              <dt>Innovation hubs</dt>
              <dd>{hubs?.length || 22}</dd>
            </div>
            <div data-reveal>
              <dt>Campuses</dt>
              <dd>3</dd>
            </div>
            <div data-reveal>
              <dt>Business stages</dt>
              <dd>4</dd>
            </div>
            <div data-reveal>
              <dt>Kinds of support</dt>
              <dd>{support?.length || 10}</dd>
            </div>
          </dl>
        </section>

        {/* How it works */}
        <section id="how" className="block">
          <div className="block-head" data-reveal>
            <p className="eyebrow eyebrow-blue">How it works</p>
            <h2 className="block-title">Four steps from idea to business.</h2>
          </div>
          <ol className="cards">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card" data-reveal>
                <span className="card-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="card-num">Step {i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Stages */}
        <section id="stages" className="block block-tint">
          <div className="block-head" data-reveal>
            <p className="eyebrow eyebrow-blue">The four stages</p>
            <h2 className="block-title">Every business is at one of these.</h2>
            <p className="block-lede">
              You choose your stage when you add your idea. To move up, post a short video as proof. Your mentor
              checks it and moves you on.
            </p>
          </div>
          <ol className="ladder">
            {STAGES.map((s, i) => (
              <li key={s.value} className="ladder-step" data-reveal>
                <span className="ladder-num">0{i + 1}</span>
                <h3>{s.label}</h3>
                <p>{s.meaning}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Who it is for */}
        <section className="block">
          <div className="block-head" data-reveal>
            <p className="eyebrow eyebrow-blue">Who it is for</p>
            <h2 className="block-title">One place for students and mentors.</h2>
          </div>
          <div className="duo">
            <div className="duo-card" data-reveal>
              <span className="card-icon" aria-hidden="true">
                <GraduationCap size={22} strokeWidth={1.75} />
              </span>
              <h3>Students get</h3>
              <ul className="ticks">
                {FOR_STUDENTS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="duo-card duo-card-dark" data-reveal>
              <span className="card-icon" aria-hidden="true">
                <Users size={22} strokeWidth={1.75} />
              </span>
              <h3>Mentors get</h3>
              <ul className="ticks">
                {FOR_MENTORS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Hubs */}
        <section id="hubs" className="block block-tint">
          <div className="block-head" data-reveal>
            <p className="eyebrow eyebrow-blue">Innovation hubs</p>
            <h2 className="block-title">Find the hub that fits your idea.</h2>
            <p className="block-lede">Each hub has its own mentors. You join one when you complete your profile.</p>
          </div>
          <ul className="chips" data-reveal aria-busy={hubs === null}>
            {(hubs ?? []).map((h) => (
              <li key={h.id} className="chip">
                {h.name}
              </li>
            ))}
            {hubs === null && Array.from({ length: 8 }, (_, i) => <li key={i} className="chip chip-ghost" />)}
          </ul>

          {support?.length > 0 && (
            <div className="support" data-reveal>
              <h3>Support you can ask for</h3>
              <ul className="support-list">
                {support.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* About */}
        <section id="about" className="block about">
          <div className="about-copy" data-reveal>
            <p className="eyebrow eyebrow-blue">About</p>
            <h2 className="block-title">The CBE Incubation Hub</h2>
            <p>
              The Incubation Hub helps students of the College of Business Education turn ideas into real
              businesses. Students join one of our innovation hubs, work with a mentor, and show their progress
              stage by stage.
            </p>
            <p>
              Every student's record lives in one place, so mentors can see who needs help and the college can see
              how its young businesses are growing.
            </p>
          </div>
          <ul className="about-points" data-reveal>
            <li>
              <MapPin aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>
                <strong>Three campuses</strong>
                {CAMPUSES.join(', ')}
              </span>
            </li>
            <li>
              <PlayCircle aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>
                <strong>Light on data</strong>
                Short videos and simple pages that work on any phone.
              </span>
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>
                <strong>Private by design</strong>
                Mentors see only the students in their own hubs.
              </span>
            </li>
            <li>
              <FileSpreadsheet aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>
                <strong>Ready for reports</strong>
                The full register downloads as Excel, hub by hub.
              </span>
            </li>
          </ul>
        </section>

        {/* Final call */}
        <section className="cta">
          <div className="cta-inner" data-reveal>
            <h2>Ready to start your business?</h2>
            <p>It takes one minute to create your account.</p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-white">
                Create your account <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-name">{APP_NAME}</p>
          <nav aria-label="Footer" className="site-footer-links">
            <a href="#how">How it works</a>
            <a href="#hubs">Hubs</a>
            <a href="#about">About</a>
            <Link to="/login">Sign in</Link>
          </nav>
          <p className="site-footer-small">{FOOTER}</p>
        </div>
      </footer>
    </div>
  )
}
