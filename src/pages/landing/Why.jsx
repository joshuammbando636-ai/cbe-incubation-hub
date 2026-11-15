import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { RollText, SectionLink } from './bits.jsx'
import { DashRing } from './DashRing.jsx'
import { gsap, SCRUB, useSectionMotion } from './motion.js'

// Section 4: a tall white section (about one and two-thirds windows) with a faint
// drawing behind the words. Two lines of text rise and fade in one after the
// other; the title block rises 24px; the arrow and the drawing follow the mouse
// (computers with a mouse only); the dash ring turns flat on scroll.
export function Why() {
  const ref = useRef(null)
  useSectionMotion(ref, ({ desktop, fine, root, q }) => {
    const rise = { y: 24, opacity: 0 }
    gsap.set(q('.f-why__line'), rise)
    gsap.set(q('.f-why__block'), rise)

    const stops = []
    // Each element plays once, when it comes into view on phones; on computers it is scrubbed.
    const lines = gsap.timeline({ paused: true })
      .to(q('.f-why__line'), { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', stagger: 0.15 })
      .to(q('.f-why__block'), { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out' }, 0.3)
    stops.push(() => lines.kill())
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && lines.play(),
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(root)
    stops.push(() => io.disconnect())

    if (desktop) {
      gsap.fromTo(
        q('.f-dash > span'),
        { rotation: (i, el) => parseFloat(el.style.getPropertyValue('--a')) / 0.2 },
        { rotation: (i, el) => parseFloat(el.style.getPropertyValue('--a')), ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom 40%', scrub: SCRUB } },
      )
    }

    // Mouse parallax: the arrow and the drawing move a little toward the pointer.
    if (desktop && fine) {
      const arrow = q('.f-why__arrow')[0]
      const pic = q('.f-why__pic')[0]
      const ax = gsap.quickTo(arrow, 'x', { duration: 0.6, ease: 'power3.out' })
      const ay = gsap.quickTo(arrow, 'y', { duration: 0.6, ease: 'power3.out' })
      const px = gsap.quickTo(pic, 'x', { duration: 0.8, ease: 'power3.out' })
      const py = gsap.quickTo(pic, 'y', { duration: 0.8, ease: 'power3.out' })
      const move = (e) => {
        const dx = e.clientX / window.innerWidth - 0.5
        const dy = e.clientY / window.innerHeight - 0.5
        ax(dx * 18)
        ay(dy * 18)
        px(dx * -28)
        py(dy * -28)
      }
      window.addEventListener('pointermove', move)
      stops.push(() => window.removeEventListener('pointermove', move))
    }
    return () => stops.forEach((s) => s())
  })

  return (
    <section className="f-why" ref={ref} data-dark="true" aria-labelledby="why-title">
      <img className="f-why__pic" src="/dashboard/thinking.webp" alt="" width="520" height="520" loading="lazy" />
      <DashRing className="f-why__dash" />
      <div className="f-why__col">
        <h2 id="why-title" className="f-why__title f-why__line">
          We all have a why.
        </h2>
        <div className="f-why__row f-why__line">
          <span className="f-why__num">01</span>
          <span>Your hub walks the talk.</span>
        </div>
        <p className="f-why__para f-why__line">
          We work here because every student with an idea deserves a fair chance to build a business, whatever their
          background.
        </p>
        <div className="f-why__block">
          <Link to="/signup" className="f-arrow f-why__arrow" aria-label="Create your account">
            <ArrowUpRight aria-hidden="true" size={26} />
          </Link>
          <SectionLink id="hubs" className="f-why__link">
            <RollText>See the hubs</RollText>
          </SectionLink>
        </div>
      </div>
    </section>
  )
}
