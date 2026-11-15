import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

// 10 × 5 squares on desktop; the first 32 make the 4 × 8 phone grid.
const TONES = ['ice', 'sky', 'white', 'cornflower', 'ice', 'white', 'sky', 'ice', 'cornflower', 'white', 'sky']
const TILES = Array.from({ length: 50 }, (_, i) => TONES[(i * 7 + Math.floor(i / 10) * 3) % TONES.length])

// Light squares fill the dark screen at random; then the line appears.
export function Tiles() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ desktop, root, q }) => {
    root.dataset.dark = 'true'
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: desktop ? 'top top' : 'top 80%',
        end: desktop ? '+=60%' : 'top 20%',
        pin: desktop ? q('.l-tiles__pin')[0] : false,
        scrub: SCRUB,
        onUpdate: (self) => (root.dataset.dark = String(self.progress < 0.5)),
      },
    })
    tl.from(q('.l-tiles__tile'), { opacity: 0, duration: 0.3, ease: 'none', stagger: { each: 0.015, from: 'random' } }).from(
      q('.l-tiles__content > *'),
      { opacity: 0, y: 18, duration: 0.25, stagger: 0.06, ease: 'power2.out' },
      '-=0.2',
    )
    return () => {
      root.dataset.dark = 'false'
    }
  })

  return (
    <section className="l-tiles" ref={ref} data-dark="false">
      <div className="l-tiles__pin">
        <div className="l-tiles__grid" aria-hidden="true">
          {TILES.map((tone, i) => (
            <span key={i} className="l-tiles__tile" style={{ background: `var(--l-${tone})` }} />
          ))}
        </div>
        <div className="l-tiles__content">
          <h2 className="l-tiles__title">That’s why the Hub exists</h2>
          <Link to="/signup" className="l-btn l-btn--primary">
            Create your account <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
