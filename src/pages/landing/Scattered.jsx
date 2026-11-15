import { useRef } from 'react'
import { countUp, gsap, onceVisible, useSectionMotion } from './motion.js'

// TODO: confirm with CBE — are these the six places students use today?
const PLACES = {
  whatsapp: ['WhatsApp groups', 'Lost messages', 'cornflower'],
  paper: ['Paper forms', 'Filled in again and again', 'sky'],
  email: ['Email threads', 'Hard to find later', 'blue'],
  notebooks: ['Notebooks', 'Easy to lose', 'midnight'],
  video: ['Video links', 'Shared, then forgotten', 'spark'],
  excel: ['Excel files', 'Out of date', 'cornflower'],
}

// 4 × 3 cells on desktop, read left to right. '' = empty cell (hidden on phones).
const CELLS = ['whatsapp', '', 'paper', '', 'n6', 'email', '', 'notebooks', '', 'video', 'excel', 'n1']
const NUMBERS = { n6: [6, 'places'], n1: [1, 'hub'] }

export function Scattered() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ q }) => {
    const cards = q('.l-scatter__card')
    gsap.set(cards, { y: 36, opacity: 0 })
    const stops = [
      onceVisible(
        q('.l-scatter__grid'),
        () => gsap.to(cards, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }),
        80,
      ),
      ...q('[data-count]').map((el) => countUp(el, Number(el.dataset.count))),
    ]
    return () => stops.forEach((stop) => stop())
  })

  return (
    <section className="l-section l-scatter" ref={ref}>
      <div className="l-wrap">
        <p className="l-note" data-reveal>
          the scattered problem
        </p>
        <h2 className="l-title l-scatter__title" data-reveal>
          Your startup shouldn’t live in six places
        </h2>
        <ul className="l-scatter__grid">
          {CELLS.map((key, i) => {
            if (NUMBERS[key]) {
              const [n, word] = NUMBERS[key]
              return (
                <li key={key} className="l-scatter__cell l-scatter__cell--num">
                  <span className="l-scatter__num">
                    <span data-count={n}>{n}</span> {word}
                  </span>
                </li>
              )
            }
            if (!key) return <li key={i} className="l-scatter__cell l-scatter__cell--empty" aria-hidden="true" />
            const [name, line, tone] = PLACES[key]
            return (
              <li key={key} className="l-scatter__cell">
                <div className="l-scatter__card">
                  <span className="l-scatter__square" style={{ background: `var(--l-${tone})` }} aria-hidden="true" />
                  <strong>{name}</strong>
                  <span>{line}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
