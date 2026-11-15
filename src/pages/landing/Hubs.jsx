import { useRef } from 'react'
import { STAGES } from '../../lib/labels.js'
import { countUp, gsap, useSectionMotion } from './motion.js'

const CAMPUSES = 3

// Live lists from Supabase (hubs, support_types): an admin's edits show here too.
export function Hubs({ hubs, support }) {
  const ref = useRef(null)
  const numbers = [
    ['Innovation hubs', hubs?.length],
    ['Campuses', CAMPUSES],
    ['Business stages', STAGES.length],
    ['Kinds of support', support?.length],
  ]

  useSectionMotion(
    ref,
    ({ q }) => {
      if (hubs?.length) {
        gsap.from(q('.l-chip'), {
          opacity: 0,
          y: 10,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.02,
          scrollTrigger: { trigger: q('.l-chips')[0], start: 'top 85%', once: true },
        })
      }
      if (support?.length) {
        gsap.from(q('.l-support h3, .l-support__list li'), {
          y: 18,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: q('.l-support')[0], start: 'top 85%', once: true },
        })
      }
      q('[data-count]').forEach((el) =>
        countUp(el, Number(el.dataset.count), { trigger: q('.l-numbers')[0], start: 'top 85%', once: true }),
      )
    },
    [hubs, support],
  )

  return (
    <section className="l-section l-hubs" id="hubs" tabIndex={-1} ref={ref}>
      <div className="l-wrap">
        <h2 className="l-title" data-reveal>
          Find the hub that fits your idea
        </h2>
        <ul className="l-chips" aria-busy={hubs === null}>
          {(hubs ?? []).map((h) => (
            <li key={h.id} className="l-chip">
              {h.name}
            </li>
          ))}
          {hubs === null &&
            Array.from({ length: 10 }, (_, i) => (
              <li key={i} className="l-chip l-chip--ghost" aria-hidden="true" style={{ width: `${120 + ((i * 53) % 110)}px` }} />
            ))}
        </ul>

        {support?.length > 0 && (
          <div className="l-support">
            <h3>Support you can ask for</h3>
            <ul className="l-support__list">
              {support.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        <dl className="l-numbers">
          {numbers.map(([label, n]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{n == null ? '–' : <span data-count={n}>{n}</span>}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
