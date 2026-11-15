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

// Sections below the first screen build their animations after the first
// paint, one section per task, in page order. Building means GSAP reading
// styles, which is slow: doing every section before the first paint kept
// phones on a blank screen in one long, blocking task. No refresh needed here:
// ScrollTrigger queues one itself when a pin is made (Questions), and each new
// trigger measures itself when created.
const waiting = []
let running = false

function buildLater(job) {
  const entry = { job }
  waiting.push(entry)
  if (!running) {
    running = true
    requestAnimationFrame(() => setTimeout(buildNext))
  }
  return () => {
    entry.job = null
  }
}

function buildNext() {
  waiting.shift()?.job?.()
  if (waiting.length) setTimeout(buildNext)
  else running = false
}

// One section's animations: gsap.context scoped to the section plus
// gsap.matchMedia, both reverted on unmount. `build` runs only when motion is
// allowed, again whenever a media condition changes, and may return a cleanup.
export function useSectionMotion(ref, build, deps = []) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return undefined
    let mm = null
    let ctx = null
    const setup = () => {
      mm = gsap.matchMedia()
      ctx = gsap.context(() => {
        mm.add(
          { motion: MQ.motion, desktop: MQ.desktop, fine: MQ.fine, rig: MQ.rig },
          (self) => {
            if (!self.conditions.motion) return undefined
            return build({ ...self.conditions, root, q: gsap.utils.selector(root) })
          },
          root,
        )
      }, root)
    }
    const offScreen = root.getBoundingClientRect().top > window.innerHeight
    const cancel = offScreen ? buildLater(setup) : setup()
    return () => {
      cancel?.()
      mm?.revert()
      ctx?.revert()
    }
    // `build` is a fresh closure each render; `deps` says when it really changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Runs `play(el)` once, the first time each element's top passes `line` of the
// screen (85% = 'top 85%'). An IntersectionObserver, not a ScrollTrigger: one-off
// entrances then cost no layout work while the page scrolls or re-measures.
export function onceVisible(targets, play, line = 85) {
  const els = gsap.utils.toArray(targets).filter(Boolean)
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        play(e.target)
      }),
    { rootMargin: `0px 0px -${100 - line}% 0px` },
  )
  els.forEach((el) => io.observe(el))
  return () => io.disconnect()
}

// The one shared entrance: [data-reveal] rises 18px and fades in once;
// children of [data-reveal-stagger] do the same, 0.06s apart.
export function revealOnScroll(root) {
  const to = { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }
  const singles = gsap.utils.toArray('[data-reveal]', root)
  const groups = gsap.utils.toArray('[data-reveal-stagger]', root)
  gsap.set(singles, { y: 18, opacity: 0 })
  groups.forEach((g) => gsap.set(g.children, { y: 18, opacity: 0 }))
  const stopSingles = onceVisible(singles, (el) => gsap.to(el, to))
  const stopGroups = onceVisible(groups, (g) => gsap.to(g.children, { ...to, stagger: 0.06 }))
  return () => {
    stopSingles()
    stopGroups()
  }
}

// Self-running loops pause while their section is off screen.
export function pauseOffscreen(el, anim) {
  anim.pause()
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim.resume() : anim.pause()))
  io.observe(el)
  return () => io.disconnect()
}

// Counts a number up from 0 once `watch` comes into view (the real number is already in the HTML).
export function countUp(el, to, watch = el) {
  const n = { v: 0 }
  return onceVisible(watch, () =>
    gsap.to(n, {
      v: to,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = String(Math.round(n.v))),
      onComplete: () => (el.textContent = String(to)),
    }),
  )
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
    // Phones (no Lenis) glide natively; reduced motion jumps. Same 88px for the header.
    const top = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    land()
  }
}
