import { useRef } from 'react'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

const PILLS = [
  'Which hub fits my idea?',
  'Who is my mentor?',
  'Did my mentor see my video?',
  'When is the next meeting?',
  'Where was that lesson link?',
  'What stage am I at?',
  'Is my idea good enough?',
  'Where do I even start?',
  'Lost in the WhatsApp group',
  'Paper forms. Again.',
]

export function Questions() {
  const ref = useRef(null)

  useSectionMotion(ref, ({ desktop, root, q }) => {
    const panel = q('.l-q__panel')[0]
    // Panel size, read once per re-measure instead of once per tween: each read
    // after a tween is set up forces the browser to lay the page out again.
    let w = panel.offsetWidth
    let h = panel.offsetHeight
    const measure = () => {
      w = panel.offsetWidth
      h = panel.offsetHeight
    }
    const W = () => w
    const H = () => h
    const near = desktop ? 1 : 0.35

    // The panel opens out to full bleed as it arrives (the page's only clip-path animation).
    gsap.fromTo(
      panel,
      { clipPath: 'inset(0% 8% 0% 8% round 32px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: SCRUB },
      },
    )

    // Pinned and scrubbed: the frame grows, the headings slide to the corners,
    // the brackets move apart and the questions pop in.
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: desktop ? '+=220%' : '+=120%',
        pin: q('.l-q__pin')[0],
        scrub: SCRUB,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
      },
    })
    // Frame: box inset 27% 16% → 13% 2.5% (lines start nearer the middle).
    const dy = () => H() * 0.14 * (desktop ? 1 : 0.6)
    const dx = () => W() * 0.135 * (desktop ? 1 : 0.6)
    tl.from(q('.l-q__line--top'), { y: dy, duration: 0.45 }, 0)
      .from(q('.l-q__line--bottom'), { y: () => -dy(), duration: 0.45 }, 0)
      .from(q('.l-q__line--left'), { x: dx, duration: 0.45 }, 0)
      .from(q('.l-q__line--right'), { x: () => -dx(), duration: 0.45 }, 0)
      .from(q('.l-q__dot--tl'), { x: dx, y: dy, duration: 0.45 }, 0)
      .from(q('.l-q__dot--tr'), { x: () => -dx(), y: dy, duration: 0.45 }, 0)
      .from(q('.l-q__dot--bl'), { x: dx, y: () => -dy(), duration: 0.45 }, 0)
      .from(q('.l-q__dot--br'), { x: () => -dx(), y: () => -dy(), duration: 0.45 }, 0)
      .from(q('.l-q__tl'), { x: 230 * near, y: 130 * near, duration: 0.5 }, 0)
      .from(q('.l-q__br'), { x: -230 * near, y: -130 * near, duration: 0.5 }, 0)
      .from(q('.l-q__bracket--l'), { x: () => W() * 0.3 * near, duration: 0.5 }, 0)
      .from(q('.l-q__bracket--r'), { x: () => -W() * 0.3 * near, duration: 0.5 }, 0)
      .from(
        q('.l-q__pill'),
        { scale: 0.01, opacity: 0, duration: 0.3, ease: 'back.out(1.4)', stagger: { each: 0.06, from: 'end' } },
        0.3,
      )

    // As it leaves, the panel shrinks back into a rounded card over the ice blue below.
    // Made after the pin, so it measures the section with the pin's extra height.
    gsap.fromTo(
      panel,
      { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
      {
        clipPath: desktop ? 'inset(0% 3% 0% 3% round 32px)' : 'inset(0% 4% 0% 4% round 24px)',
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { trigger: root, start: 'bottom bottom', end: 'bottom 35%', scrub: 1 },
      },
    )
  })

  return (
    <section className="l-q" ref={ref} data-dark="true">
      <div className="l-q__pin">
        <div className="l-q__panel">
          {/* TODO: confirm with CBE — this blurred picture is a drawn stand-in; swap in a real student photo. */}
          <img
            className="l-q__photo"
            src="/landing/student-blur.jpg"
            alt=""
            width="1600"
            height="1000"
            loading="lazy"
            decoding="async"
          />
          <div className="l-q__shade" aria-hidden="true" />
          <div className="l-q__frame" aria-hidden="true">
            <span className="l-q__line l-q__line--top" />
            <span className="l-q__line l-q__line--bottom" />
            <span className="l-q__line l-q__line--left" />
            <span className="l-q__line l-q__line--right" />
            <span className="l-q__dot l-q__dot--tl" />
            <span className="l-q__dot l-q__dot--tr" />
            <span className="l-q__dot l-q__dot--bl" />
            <span className="l-q__dot l-q__dot--br" />
          </div>
          <span className="l-q__bracket l-q__bracket--l" aria-hidden="true">
            (
          </span>
          <span className="l-q__bracket l-q__bracket--r" aria-hidden="true">
            )
          </span>
          <h2 className="l-q__title">
            <span className="l-q__tl">So many questions pulling you away</span>{' '}
            <span className="l-q__br">from building your business</span>
          </h2>
          <ul className="l-q__pills">
            {PILLS.map((text) => (
              <li key={text} className="l-q__pill">
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
