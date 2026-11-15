import { BadgeCheck, CalendarDays, Check, Megaphone, Play, Video } from 'lucide-react'
import { useRef } from 'react'
import { STAGES } from '../../lib/labels.js'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

// TODO: confirm with CBE — the one-liners and ticks below are drafted from content.md.
const CARDS = [
  {
    title: 'See where you stand',
    line: 'Your stage, your hub and your mentor, on one screen.',
    ticks: ['Four clear stages', 'Your hub and your mentor', 'What to do next', 'Only a mentor moves your stage'],
    mock: 'stages',
  },
  {
    title: 'Show your progress',
    line: 'Post a short video. Your mentor watches it and replies.',
    ticks: ['Upload to YouTube as Unlisted', 'Paste the link', 'Feedback from your mentor', 'Move up when it is approved'],
    mock: 'video',
  },
  {
    title: 'Learn on your phone',
    line: 'Short video lessons from your mentors.',
    ticks: ['Works on any phone', 'For your hub or for everyone', 'Tick each one when you finish', 'See how many you have done'],
    mock: 'lessons',
  },
  {
    title: 'Never miss a meeting',
    line: 'Meetings and news from your hub, in one place.',
    ticks: ['Your next meeting and its link', 'Notices from your mentors', 'New ones are marked', 'Nothing lost in a group chat'],
    mock: 'meetings',
  },
]

function MiniMock({ kind }) {
  if (kind === 'stages')
    return (
      <div className="l-mini">
        <ol className="l-mini__stages">
          {STAGES.map((s, i) => (
            <li key={s.value} className={i < 2 ? 'is-done' : i === 2 ? 'is-now' : ''}>
              <span className="l-mini__dot" />
              {s.label}
            </li>
          ))}
        </ol>
        <span className="l-mini__badge">
          <BadgeCheck size={16} /> Mentor verified
        </span>
      </div>
    )
  if (kind === 'video')
    return (
      <div className="l-mini">
        {[
          [STAGES[2].label, 'Waiting for review', ''],
          [STAGES[1].label, 'Verified', 'is-ok'],
        ].map(([stage, status, cls]) => (
          <div key={stage} className="l-mini__row">
            <span className="l-mini__thumb">
              <Video size={18} />
            </span>
            <span className="l-mini__grow">{stage}</span>
            <span className={`l-mini__pill ${cls}`}>{status}</span>
          </div>
        ))}
      </div>
    )
  if (kind === 'lessons')
    return (
      <div className="l-mini">
        {['Know your customer', 'Price your product', 'Pitch in two minutes'].map((t, i) => (
          <div key={t} className="l-mini__row">
            <span className="l-mini__play">
              <Play size={14} fill="currentColor" />
            </span>
            <span className="l-mini__grow">{t}</span>
            {i === 0 && <Check size={18} className="l-mini__tick" />}
          </div>
        ))}
      </div>
    )
  return (
    <div className="l-mini">
      <div className="l-mini__row l-mini__row--big">
        <span className="l-mini__thumb">
          <CalendarDays size={18} />
        </span>
        <span className="l-mini__grow">
          <strong>Next meeting</strong>
          <br />
          Hub check-in · Wed, 14:00
        </span>
      </div>
      {['New lesson posted', 'Meeting link added'].map((t, i) => (
        <div key={t} className="l-mini__row">
          <span className="l-mini__play">
            <Megaphone size={14} />
          </span>
          <span className="l-mini__grow">{t}</span>
          {i === 0 && <span className="l-mini__pill is-ok">New</span>}
        </div>
      ))}
    </div>
  )
}

// Big cards that stick and stack; a covered card tips back and shrinks a little.
export function Stack() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ desktop, q }) => {
    if (!desktop) return
    const cards = q('.l-stack__card')
    const last = cards[cards.length - 1]
    cards.slice(0, -1).forEach((card, i) => {
      gsap.to(card, {
        rotateX: -8,
        scale: 1 - 0.04 * (cards.length - 1 - i),
        ease: 'none',
        transformOrigin: '50% 0%',
        scrollTrigger: {
          trigger: cards[i + 1],
          start: 'top bottom',
          endTrigger: last,
          end: `top ${96 + (cards.length - 1) * 16}px`,
          scrub: SCRUB,
          invalidateOnRefresh: true,
        },
      })
    })
  })

  return (
    <section className="l-section l-stack" id="stages" tabIndex={-1} ref={ref}>
      <div className="l-wrap">
        <h2 className="l-title" data-reveal>
          Your Hub at a glance
        </h2>
        <div className="l-stack__list">
          {CARDS.map((c, i) => (
            <article key={c.title} className="l-stack__card" style={{ '--i': i }} data-reveal>
              <div className="l-stack__text">
                <span className="l-stack__count">
                  {i + 1}/{CARDS.length}
                </span>
                <h3>{c.title}</h3>
                <p>{c.line}</p>
                <ul className="l-ticks">
                  {c.ticks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="l-stack__mock" aria-hidden="true">
                <MiniMock kind={c.mock} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
