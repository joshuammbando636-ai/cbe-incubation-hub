import { Plus } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from './motion.js'

// An empty answer is not shown until CBE gives one.
const FAQS = [
  // TODO: confirm with CBE
  ['Who can join?', 'Students of the College of Business Education with a business idea, at any stage.'],
  // TODO: confirm with CBE — the spec's answer is "[confirm with CBE]", so this one stays hidden for now.
  ['Does it cost anything?', ''],
  ['Do I need a laptop?', 'No. The site works on any phone. Lessons are short videos.'],
  [
    'How do I choose a hub?',
    'Pick the innovation hub closest to your idea when you complete your profile. Each hub has its own mentors.',
  ],
  ['Who can see my idea?', 'Only the mentors of your hub and the Hub’s admins.'],
  ['How do I move up a stage?', 'Post a short video showing your progress. Your mentor checks it and moves you up.'],
  [
    'I’m already registered with CBE. Do I fill everything in again?',
    'No. When you confirm your email, we fill in the details CBE already has.',
  ],
].filter(([, answer]) => answer)

// One answer open at a time; it opens with a height tween (instant with reduced motion).
export function Faq() {
  const [open, setOpen] = useState(-1)
  const panels = useRef([])

  useLayoutEffect(() => {
    panels.current.forEach((el, i) => {
      if (!el) return
      const isOpen = i === open
      if (isOpen === !el.hidden) return
      gsap.killTweensOf(el)
      const done = () => {
        if (!isOpen) el.hidden = true
        gsap.set(el, { clearProps: 'height' })
        ScrollTrigger.refresh()
      }
      if (prefersReducedMotion()) {
        el.hidden = !isOpen
        done()
      } else if (isOpen) {
        el.hidden = false
        gsap.fromTo(el, { height: 0 }, { height: 'auto', duration: 0.45, ease: 'power2.inOut', onComplete: done })
      } else {
        gsap.to(el, { height: 0, duration: 0.45, ease: 'power2.inOut', onComplete: done })
      }
    })
  }, [open])

  return (
    <section className="l-section l-faq" id="faq" tabIndex={-1}>
      <div className="l-wrap l-faq__grid">
        <h2 className="l-title l-faq__title" data-reveal>
          FAQ
        </h2>
        <div className="l-faq__list" data-reveal-stagger>
          {FAQS.map(([question, answer], i) => (
            <div key={question} className="l-faq__item">
              <h3 className="l-faq__q">
                <button
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen((o) => (o === i ? -1 : i))}
                >
                  <span>{question}</span>
                  <span className="l-faq__icon" aria-hidden="true">
                    <Plus size={20} strokeWidth={2} />
                  </span>
                </button>
              </h3>
              <div id={`faq-${i}`} className="l-faq__a" hidden ref={(el) => {
                  panels.current[i] = el
                }}>
                <p>{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
