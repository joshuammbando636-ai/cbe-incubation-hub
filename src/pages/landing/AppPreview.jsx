import { Bell, BookOpen, Home, Lightbulb, Play, TrendingUp } from 'lucide-react'
import { useRef } from 'react'
import { STAGES } from '../../lib/labels.js'
import { gsap, pauseOffscreen, useSectionMotion } from './motion.js'
import { Badge } from './shapes.jsx'

const MENU = [
  [Home, 'Home'],
  [Lightbulb, 'My idea'],
  [TrendingUp, 'Progress'],
  [BookOpen, 'Lessons'],
  [Bell, 'Notices'],
]

// Sample content for the picture only. TODO: confirm with CBE (sample name and lesson titles).
const SAMPLE_NAME = 'Amina'
const SAMPLE_LESSONS = ['Know your customer', 'Price your product', 'Pitch in two minutes']

// A still picture of the student dashboard, made from divs. On a desktop with
// a mouse it sits tilted in 3D, flattens as it scrolls in and follows the pointer.
export function AppPreview() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ rig, root, q }) => {
    const stage = q('.l-rig__stage')[0]

    // Inside the picture: the video gets verified and the stage moves on, then back. Paused off screen.
    const set = (state) => () => {
      root.dataset.mock = state
    }
    const loop = gsap.timeline({ repeat: -1 })
    root.dataset.mock = 'waiting'
    loop
      .set(q('.l-mock__fill'), { scaleX: 1 / 3 })
      .call(set('verified'), null, 6)
      .to(q('.l-mock__fill'), { scaleX: 2 / 3, duration: 0.6, ease: 'power2.inOut' }, 6)
      .call(set('waiting'), null, 12)
      .to(q('.l-mock__fill'), { scaleX: 1 / 3, duration: 0.6, ease: 'power2.inOut' }, 12)
    const stopWatching = pauseOffscreen(root, loop)

    if (!rig) {
      return () => {
        stopWatching()
        delete root.dataset.mock
      }
    }

    // Desktop: flatten on scroll (rx 14° → 2°, ry -10° → 0°, scale 1 → 1.03) plus pointer tilt (±8°).
    const view = { rx: 14, ry: -10, s: 1, tx: 0, ty: 0 }
    const apply = () => {
      stage.style.setProperty('--rx', `${view.rx + view.tx}deg`)
      stage.style.setProperty('--ry', `${view.ry + view.ty}deg`)
      stage.style.setProperty('--s', view.s)
    }
    gsap.to(view, {
      rx: 2,
      ry: 0,
      s: 1.03,
      ease: 'none',
      onUpdate: apply,
      scrollTrigger: { trigger: stage, start: 'top 85%', end: 'center center', scrub: 1 },
    })
    const tiltX = gsap.quickTo(view, 'tx', { duration: 0.6, ease: 'power3.out', onUpdate: apply })
    const tiltY = gsap.quickTo(view, 'ty', { duration: 0.6, ease: 'power3.out', onUpdate: apply })
    const rigEl = q('.l-rig')[0]
    const move = (e) => {
      const r = rigEl.getBoundingClientRect()
      tiltY(((e.clientX - r.left) / r.width - 0.5) * 16)
      tiltX(-((e.clientY - r.top) / r.height - 0.5) * 16)
    }
    const leave = () => {
      tiltX(0)
      tiltY(0)
    }
    rigEl.addEventListener('pointermove', move)
    rigEl.addEventListener('pointerleave', leave)
    return () => {
      stopWatching()
      rigEl.removeEventListener('pointermove', move)
      rigEl.removeEventListener('pointerleave', leave)
      stage.style.removeProperty('--rx')
      stage.style.removeProperty('--ry')
      stage.style.removeProperty('--s')
      delete root.dataset.mock
    }
  })

  return (
    <section className="l-app" ref={ref}>
      <div className="l-wrap">
        <div className="l-rig" data-reveal>
          <div className="l-rig__stage">
            <div
              className="l-mock"
              role="img"
              aria-label="A picture of the student dashboard: your stage, your next meeting, your progress video and your lessons."
            >
              <div className="l-mock__side">
                <Badge />
                {MENU.map(([Icon, label], i) => (
                  <span key={label} className={`l-mock__nav${i === 0 ? ' is-on' : ''}`}>
                    <Icon size={16} strokeWidth={2} /> {label}
                  </span>
                ))}
              </div>
              <div className="l-mock__main">
                <p className="l-mock__hello">Good morning, {SAMPLE_NAME}</p>

                <div className="l-mock__card l-mock__stages">
                  <span className="l-mock__label">Your stage</span>
                  <div className="l-mock__track">
                    <span className="l-mock__fill" />
                    {STAGES.map((s, i) => (
                      <span key={s.value} className="l-mock__step" data-i={i}>
                        <span className="l-mock__dot" />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="l-mock__pair">
                  <div className="l-mock__card">
                    <span className="l-mock__label">Next meeting</span>
                    <strong>Hub check-in</strong>
                    <span className="l-mock__muted">Wed, 14:00</span>
                  </div>
                  <div className="l-mock__card">
                    <span className="l-mock__label">Progress video</span>
                    <strong>{STAGES[2].label}</strong>
                    <span className="l-mock__status">
                      <span className="l-mock__status-a">Waiting for review</span>
                      <span className="l-mock__status-b">Verified ✓</span>
                    </span>
                  </div>
                </div>

                <div className="l-mock__card">
                  <span className="l-mock__label">Lessons</span>
                  <ul className="l-mock__lessons">
                    {SAMPLE_LESSONS.map((t) => (
                      <li key={t}>
                        <span className="l-mock__play">
                          <Play size={12} fill="currentColor" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <span className="l-rig__float l-rig__float--a" aria-hidden="true">
              Mentor verified ✓
            </span>
            <span className="l-rig__float l-rig__float--b" aria-hidden="true">
              Video posted
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
