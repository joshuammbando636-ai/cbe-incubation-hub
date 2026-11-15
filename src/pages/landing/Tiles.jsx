import { useRef } from 'react'
import { AppPreview } from './AppPreview.jsx'
import { gsap, useSectionMotion } from './motion.js'

// Big soft tiles over ice blue: 8 columns on desktop, 4 on phones (extra rows are cut off).
// Each tile is sky or white at a gentle strength, a few stay empty. Fixed pattern, no randomness per load.
const TILES = Array.from({ length: 96 }, (_, i) => {
  const h = Math.imul(i + 7, 2654435761) >>> 0
  if (h % 5 === 0) return null
  return { tone: h % 3 === 0 ? 'white' : 'sky', o: [0.3, 0.45, 0.6][(h >>> 4) % 3] }
})

// After the dark card leaves: the line, then the dashboard rises over the tiles.
export function Tiles() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ q, root }) => {
    // Scrubbed and slow: each tile takes a long stretch of scroll to appear, so the fade is smooth.
    gsap.from(q('.l-why__tile'), {
      opacity: 0,
      duration: 1,
      ease: 'none',
      stagger: { amount: 1.5, from: 'random' },
      scrollTrigger: { trigger: root, start: 'top 45%', end: 'center top', scrub: 1 },
    })
  })

  return (
    <section className="l-why" ref={ref}>
      <div className="l-why__tiles" aria-hidden="true">
        {TILES.map((t, i) => (
          <span
            key={i}
            className="l-why__tile"
            style={t ? { background: `var(--l-${t.tone})`, '--o': t.o } : { '--o': 0 }}
          />
        ))}
      </div>
      <div className="l-wrap">
        <h2 className="l-why__title" data-reveal>
          That’s why CBE Incubation Hub exists
        </h2>
      </div>
      <AppPreview />
    </section>
  )
}
