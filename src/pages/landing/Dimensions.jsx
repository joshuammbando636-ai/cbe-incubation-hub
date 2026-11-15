import { useRef } from 'react'
import { RollText, SectionLink } from './bits.jsx'
import { DashRing } from './DashRing.jsx'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

// Section 3: a tall blue section (about one window and a third), white text.
// Computers: pinned for a window of scrolling while the box fades in; the dash
// ring turns from steep to flat. The N E S W ring tilts -1 degree on hover.
export function Dimensions() {
  const ref = useRef(null)
  useSectionMotion(ref, ({ desktop, root, q }) => {
    if (!desktop) return undefined
    gsap.set(q('.f-dim__box'), { opacity: 0 })
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top top', end: '+=60%', pin: true, scrub: SCRUB, anticipatePin: 1 },
    })
    tl.to(q('.f-dim__box'), { opacity: 1, ease: 'none' }, 0)
    gsap.fromTo(
      q('.f-dash > span'),
      { rotation: (i, el) => parseFloat(el.style.getPropertyValue('--a')) / 0.2 },
      { rotation: (i, el) => parseFloat(el.style.getPropertyValue('--a')), ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: '+=60%', scrub: SCRUB } },
    )
    return undefined
  })

  return (
    <section className="f-dim" ref={ref} data-dark="true" aria-labelledby="dim-title">
      <DashRing className="f-dim__dash" />
      <div className="f-dim__box">
        <p className="f-dim__nesw">
          <span className="f-dim__n">N</span> E S W
          <span className="f-dim__sub">Driven by students</span>
        </p>
        <h2 id="dim-title" className="f-dim__title">
          Open new doors for your business.
        </h2>
        <p className="f-dim__text">
          Our hubs help students test ideas, learn what customers want and find the first sale, with a mentor at every
          step.
        </p>
        <SectionLink id="hubs" className="f-dim__btn">
          <RollText>See the hubs</RollText>
        </SectionLink>
      </div>
    </section>
  )
}
