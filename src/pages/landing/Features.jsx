import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HandHelping,
  History,
  Lightbulb,
  MapPin,
  MessageSquareText,
  PlayCircle,
  TrendingUp,
  UserPlus,
  Video,
} from 'lucide-react'
import { useRef } from 'react'
import { gsap, useSectionMotion } from './motion.js'

const supportLine = (n) => `Choose from the ${n ? `${n} ` : ''}kinds of support the Hub offers.`

const PHASES = [
  {
    tag: 'Start',
    title: 'Get set up in a day',
    cards: [
      [UserPlus, 'Create your account', 'Sign up with your email. Takes a minute.'],
      [ClipboardCheck, 'Your details filled in', 'Registered with CBE? We fill them in for you.'],
      [MapPin, 'Pick your hub', 'Choose the innovation hub that fits your idea.'],
    ],
  },
  {
    tag: 'Build',
    title: 'Shape your idea',
    cards: [
      [Lightbulb, 'Describe your idea', 'Your business, its sector and its stage.'],
      [PlayCircle, 'Video lessons', 'Short lessons you can watch on your phone.'],
      [CalendarDays, 'Meetings and notices', 'Everything from your hub in one place.'],
    ],
  },
  {
    tag: 'Prove',
    title: 'Show your progress',
    cards: [
      [Video, 'Post a progress video', 'A short video when you move forward.'],
      [MessageSquareText, 'Mentor review', 'Your mentor watches it and gives feedback.'],
      [TrendingUp, 'Move up a stage', 'Approved? You move to the next stage.'],
    ],
  },
  {
    tag: 'Grow',
    title: 'Get the help you need',
    cards: [
      [GraduationCap, 'A mentor in your field', 'Someone who knows your industry.'],
      [HandHelping, 'Ask for support', supportLine],
      [History, 'Your record', 'A clear history of how far you’ve come.'],
    ],
  },
]

const TONES = ['sky', 'ice', 'cornflower', 'white']

// Each row plays once as it scrolls in. Desktop: the first card rises, then the
// other two slide out from behind it. Phone: each card slides out from behind the one above.
export function Features({ supportCount }) {
  const ref = useRef(null)

  useSectionMotion(ref, ({ desktop, q }) => {
    if (!desktop) {
      q('.l-feat-card').forEach((card) => {
        gsap.from(card, {
          yPercent: -35,
          scale: 0.94,
          opacity: 0,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        })
      })
      return
    }
    q('.l-feat-grid').forEach((grid) => {
      const [first, ...rest] = grid.children
      gsap
        .timeline({ scrollTrigger: { trigger: grid, start: 'top 80%', once: true } })
        .from(first, { y: 60, opacity: 0, duration: 0.7, ease: 'expo.out' })
        .from(
          rest,
          { x: (i, card) => first.offsetLeft - card.offsetLeft, duration: 0.9, ease: 'expo.out', stagger: 0.08 },
          0.35,
        )
        .from(rest, { opacity: 0, duration: 0.01 }, 0.35)
    })
  })

  return (
    <section className="l-section l-feat" id="how" tabIndex={-1} ref={ref}>
      <div className="l-wrap">
        <h2 className="l-title l-feat__title" data-reveal>
          Everything you need at every stage
        </h2>
        {PHASES.map((phase, row) => (
          <div key={phase.tag} className="l-feat__row">
            <div className="l-feat__label">
              <span className="l-tag">{phase.tag}</span>
              <h3>{phase.title}</h3>
            </div>
            <ul className="l-feat-grid">
              {phase.cards.map(([Icon, title, line], col) => {
                const tone = TONES[(row * 3 + col) % TONES.length]
                return (
                  <li key={title} className="l-feat-card" data-col={col} style={{ background: `var(--l-${tone})` }}>
                    <h4>{title}</h4>
                    <p>{typeof line === 'function' ? line(supportCount) : line}</p>
                    <Icon className="l-feat-card__icon" size={72} strokeWidth={1.5} aria-hidden="true" />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
