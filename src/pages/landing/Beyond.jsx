import { useRef } from 'react'
import { Link } from 'react-router'
import { RollText } from './bits.jsx'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

const STEPS = ['A mentor in your field', 'Short lessons on your phone', 'Meetings and notices in one place']

// Section 2: a white page, text in a centred 700px column. On computers the
// section is pinned for one window of scrolling: the three list items rise 262px
// together, the paragraph fades in, the heading block rises 110px and slides in
// from the right, and the word "stage" drops 257px and slides in from the left.
// Phones: no pin, the parts just show.
export function Beyond() {
  const ref = useRef(null)
  useSectionMotion(ref, ({ desktop, root, q }) => {
    if (!desktop) return undefined
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top top', end: '+=100%', pin: true, scrub: SCRUB, anticipatePin: 1 },
    })
    tl.fromTo(q('.f-beyond__item'), { y: 262 }, { y: 0, ease: 'none' }, 0)
      .fromTo(q('.f-beyond__para'), { opacity: 0 }, { opacity: 1, ease: 'none' }, 0.1)
      .fromTo(q('.f-beyond__block'), { y: 110, x: 234 }, { y: 0, x: 0, ease: 'none' }, 0)
      .fromTo(q('.f-beyond__word'), { y: 257, x: -234 }, { y: 0, x: 0, ease: 'none' }, 0)
    return undefined
  })

  return (
    <section className="f-beyond" ref={ref} aria-labelledby="beyond-title">
      <div className="f-beyond__col">
        <div className="f-beyond__block">
          <h2 id="beyond-title" className="f-beyond__title">
            Beyond the idea
          </h2>
        </div>
        <p className="f-beyond__para">
          Most student ideas stay on paper because nobody shows them how to move forward. Our programme gives every idea a
          clear path: a mentor, short lessons, and a stage to reach at a time.
        </p>
        <ul className="f-beyond__list">
          {STEPS.map((s) => (
            <li key={s} className="f-beyond__item">
              {s}
            </li>
          ))}
        </ul>
        <Link to="/signup" className="f-beyond__cta">
          <RollText>See how</RollText>
        </Link>
        <p className="f-beyond__word" aria-hidden="true">
          stage
        </p>
        <p className="f-fig f-fig--1" aria-hidden="true">
          FIG 01 · THE GAP
        </p>
        <p className="f-fig f-fig--2" aria-hidden="true">
          FIG 02 · THE PATH
        </p>
      </div>
    </section>
  )
}
