import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, INTRO_SEEN_KEY, MQ } from './motion.js'
import { Badge } from './shapes.jsx'

// Full-screen blue sheet: lines draw in, the badge pops, the sheet slides up.
// While the app still checks who is signed in (`pending`), the sheet stays,
// so a signed-in person never sees the landing page flash before their dashboard.
// Without the intro (seen already, or reduced motion) the cover is a plain,
// page-coloured sheet that disappears as soon as the check is done.
export function Intro({ play, pending, onOut }) {
  const ref = useRef(null)
  const tl = useRef(null)
  const held = useRef(false)
  const pendingNow = useRef(pending)
  const [gone, setGone] = useState(!play && !pending)

  useEffect(() => {
    pendingNow.current = pending
    if (pending) return
    if (!play) {
      setGone(true)
      onOut()
    } else if (held.current) {
      held.current = false
      onOut()
      tl.current?.play()
    }
  }, [pending, play, onOut])

  useLayoutEffect(() => {
    if (!play) return undefined
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // Storage blocked: the intro may play again next time. Harmless.
    }
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add({ motion: MQ.motion }, ({ conditions }) => {
        if (!conditions.motion) {
          if (!pendingNow.current) {
            setGone(true)
            onOut()
          }
          return
        }
        const t = gsap.timeline({ onComplete: () => setGone(true) })
        t.from('.l-intro__v', { scaleY: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.04 }, 0)
          .from('.l-intro__h', { scaleX: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.04 }, 0)
          .from('.l-intro__dot', { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.35)
          .from('.l-intro__badge', { scale: 0, duration: 0.4, ease: 'back.out(1.7)' }, 0.2)
          .call(
            () => {
              if (pendingNow.current) {
                held.current = true
                t.pause()
              } else onOut()
            },
            null,
            0.9,
          )
          .to('.l-intro', { yPercent: -100, duration: 0.7, ease: 'power4.inOut' }, 0.9)
        tl.current = t
      })
    }, ref)
    return () => {
      mm.revert()
      ctx.revert()
      tl.current = null
    }
    // Runs once: `onOut` is stable and `pending` is read through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play])

  if (gone) return null
  if (!play) return <div className="l-cover" aria-hidden="true" />

  return (
    <div className="l-intro-wrap" ref={ref} aria-hidden="true">
      <div className="l-intro">
        <span className="l-intro__v" style={{ left: '22%' }} />
        <span className="l-intro__v" style={{ left: '50%' }} />
        <span className="l-intro__v" style={{ left: '78%' }} />
        <span className="l-intro__h" style={{ top: '30%' }} />
        <span className="l-intro__h" style={{ top: '70%' }} />
        <span className="l-intro__dot" style={{ left: '22%', top: '30%' }} />
        <span className="l-intro__dot" style={{ left: '78%', top: '30%' }} />
        <span className="l-intro__dot" style={{ left: '22%', top: '70%' }} />
        <span className="l-intro__dot" style={{ left: '78%', top: '70%' }} />
        <Badge tone="white" className="l-intro__badge" />
      </div>
    </div>
  )
}
