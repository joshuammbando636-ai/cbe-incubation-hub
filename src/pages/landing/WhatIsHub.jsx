import { BadgeCheck, BookOpen, CalendarDays, Lightbulb, MessageCircle, TrendingUp, Users, Video } from 'lucide-react'
import { useRef } from 'react'
import { gsap, SCRUB, useSectionMotion } from './motion.js'
import { Badge } from './shapes.jsx'

// Shapes around the badge. d = desktop offset from the centre, m = phone offset
// (null = not shown on phones). far = one of the two lowest: blurred on desktop.
const ORBIT = [
  { icon: Lightbulb, form: 'circle', size: 120, tone: 'sky', r: 0, d: [-300, -150], m: [-112, -118] },
  { icon: Video, form: 'square', size: 110, tone: 'midnight', r: -8, d: [-80, -215], m: [8, -150] },
  { icon: CalendarDays, form: 'diamond', size: 100, tone: 'cornflower', r: 45, d: [150, -195], m: [118, -100] },
  { icon: MessageCircle, form: 'circle', size: 130, tone: 'ice', r: 0, d: [320, -60], m: null },
  { icon: BookOpen, form: 'square', size: 120, tone: 'cornflower', r: 6, d: [280, 140], m: [118, 92] },
  { icon: Users, form: 'diamond', size: 110, tone: 'midnight', r: 45, d: [70, 215], m: [16, 146], far: true },
  { icon: TrendingUp, form: 'circle', size: 90, tone: 'sky', r: 0, d: [-190, 200], m: [-110, 104], far: true },
  { icon: BadgeCheck, form: 'square', size: 100, tone: 'ice', r: -6, d: [-330, 50], m: null },
]

export function WhatIsHub() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ q }) => {
    // Scrubbed: the shapes start tucked behind the badge and spread out.
    gsap.from(q('.l-orbit__item'), {
      x: 0,
      y: 0,
      scale: 0.3,
      rotation: -90,
      ease: 'power1.out',
      stagger: 0.04,
      scrollTrigger: { trigger: q('.l-orbit')[0], start: 'top 90%', end: 'center 45%', scrub: SCRUB },
    })
  })

  return (
    <section className="l-section l-what" ref={ref}>
      <div className="l-wrap l-what__head">
        <h2 className="l-note" data-reveal>
          What is the Hub
        </h2>
        <p className="l-what__lead" data-reveal>
          The CBE Incubation Hub helps students turn ideas into real businesses, with a mentor, short lessons and a
          clear path from idea to income.
        </p>
      </div>

      <div className="l-orbit" aria-hidden="true">
        <Badge className="l-orbit__badge" />
        {ORBIT.map(({ icon: Icon, form, size, tone, r, d, m, far }, i) => (
          <span
            key={i}
            className={`l-orbit__item l-orbit__item--${form}${far ? ' is-far' : ''}${m ? '' : ' is-wide-only'}`}
            style={{
              '--size': `${size}px`,
              '--r': `${r}deg`,
              '--dx': `${d[0]}px`,
              '--dy': `${d[1]}px`,
              '--mx': `${m ? m[0] : 0}px`,
              '--my': `${m ? m[1] : 0}px`,
              background: `var(--l-${tone})`,
              color: tone === 'ice' ? 'var(--l-blue)' : '#ffffff',
            }}
          >
            <Icon size={36} strokeWidth={1.75} />
          </span>
        ))}
      </div>

      <div className="l-wrap">
        <p className="l-what__loop" data-reveal>
          Every business grows in loops: try, learn, show your progress, get feedback. The Hub keeps the loop going,
          so you always know what to do next.
        </p>
      </div>
    </section>
  )
}
