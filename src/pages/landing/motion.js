// Shared motion pieces for the landing page only.
// Rules (from the landing spec): animate transform, opacity and clip-path only;
// every animation lives inside gsap.matchMedia so reduced motion gets the
// final, still page; content is visible without JS (gsap.from only in here).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)
// Phones: the address bar showing/hiding must not re-measure pinned sections.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }

export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 768px)',
  fine: '(hover: hover) and (pointer: fine)',
  rig: '(min-width: 900px) and (hover: hover) and (pointer: fine)',
}

export const SCRUB = 0.6

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const INTRO_SEEN_KEY = 'cbe-intro-seen'

// The intro plays once per browser session, never with reduced motion.
export function shouldPlayIntro() {
  if (prefersReducedMotion()) return false
  try {
    return !sessionStorage.getItem(INTRO_SEEN_KEY)
  } catch {
    return false
  }
}

// One section's animations: gsap.context scoped to the section plus
// gsap.matchMedia, both reverted on unmount. `build` runs only when motion is
// allowed, again whenever a media condition changes, and may return a cleanup.
export function useSectionMotion(ref, build, deps = []) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add(
        { motion: MQ.motion, desktop: MQ.desktop, fine: MQ.fine, rig: MQ.rig },
        (self) => {
          if (!self.conditions.motion) return undefined
          return build({ ...self.conditions, root, q: gsap.utils.selector(root) })
        },
        root,
      )
    }, root)
    return () => {
      mm.revert()
      ctx.revert()
    }
    // `build` is a fresh closure each render; `deps` says when it really changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// The one shared entrance: [data-reveal] rises 18px and fades in once;
// children of [data-reveal-stagger] do the same, 0.06s apart.
export function revealOnScroll(root) {
  const from = { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out' }
  gsap.utils.toArray('[data-reveal]', root).forEach((el) => {
    gsap.from(el, { ...from, scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
  })
  gsap.utils.toArray('[data-reveal-stagger]', root).forEach((el) => {
    gsap.from(el.children, {
      ...from,
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    })
  })
}

// Self-running loops pause while their section is off screen.
export function pauseOffscreen(el, anim) {
  anim.pause()
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim.resume() : anim.pause()))
  io.observe(el)
  return () => io.disconnect()
}

// Counts a number up from 0 (the real number is already in the HTML).
export function countUp(el, to, scrollTrigger) {
  const n = { v: 0 }
  return gsap.to(n, {
    v: to,
    duration: 1.1,
    ease: 'power2.out',
    onUpdate: () => (el.textContent = String(Math.round(n.v))),
    onComplete: () => (el.textContent = String(to)),
    scrollTrigger,
  })
}

// Lenis lives in Landing.jsx; links to #how, #hubs… scroll through it.
let lenis = null
export const setLenis = (instance) => {
  lenis = instance
}
export const getLenis = () => lenis

export function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const land = () => el.focus({ preventScroll: true })
  if (lenis) {
    lenis.scrollTo(el, { offset: -88, duration: 1.2, onComplete: land })
  } else {
    el.scrollIntoView({ block: 'start' })
    land()
  }
}
