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
import { gsap, SCRUB, useSectionMotion } from './motion.js'

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

// The star effect: each card swings up from a cone (hinged at its top edge) as it scrolls in.
export function Features({ supportCount }) {
  const ref = useRef(null)

  useSectionMotion(ref, ({ desktop, q }) => {
    q('.l-feat-card').forEach((card) => {
      const c = desktop ? Number(card.dataset.col) : 0
      gsap.fromTo(
        card,
        { rotateX: desktop ? -45 : -20, y: desktop ? 60 : 40, opacity: 0.35 },
        {
          rotateX: 0,
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: `top bottom-=${c * 40}`, end: 'top 55%', scrub: SCRUB },
        },
      )
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
