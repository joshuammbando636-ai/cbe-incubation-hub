import Lenis from 'lenis'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useTitle } from '../lib/useTitle.js'
import { FinalCta, Footer } from './landing/Closing.jsx'
import { Beyond } from './landing/Beyond.jsx'
import { Dimensions } from './landing/Dimensions.jsx'
import { Faq } from './landing/Faq.jsx'
import { Features } from './landing/Features.jsx'
import { Header } from './landing/Header.jsx'
import { Hubs } from './landing/Hubs.jsx'
import { Intro } from './landing/Intro.jsx'
import { Journey, JourneyCard } from './landing/Journey.jsx'
import { Stack } from './landing/Stack.jsx'
import { Why } from './landing/Why.jsx'
import {
  gsap,
  MQ,
  prefersReducedMotion,
  revealOnScroll,
  ScrollTrigger,
  setLenis,
  shouldPlayIntro,
  useSectionMotion,
} from './landing/motion.js'
import './landing.css'
import './landing/front.css'

// Hubs and support types come from the database, so an admin's edits show here too.
function useList(table) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    let stale = false
    supabase
      .from(table)
      .select('id, name')
      .order('name')
      .then(({ data }) => !stale && setRows(data ?? []))
    return () => {
      stale = true
    }
  }, [table])
  return rows
}

// Smooth scrolling on this page only. Lenis moves the real page scroll, so
// sticky elements, ScrollTrigger and the keyboard keep working. Not on
// touch-only phones and tablets: Lenis leaves touch scrolling native there
// (syncTouch off), so it would only cost start-up time.
function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia(MQ.fine).matches) return undefined
    const lenis = new Lenis({ syncTouch: false, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setLenis(lenis)
    return () => {
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      setLenis(null)
    }
  }, [])
}

export function Landing({ authPending = false }) {
  useTitle('Welcome')
  const root = useRef(null)
  const hubs = useList('hubs')
  const support = useList('support_types')
  const [playIntro] = useState(shouldPlayIntro)
  // `ready` turns true when the intro sheet starts to slide away: the hero enters then.
  const [ready, setReady] = useState(() => !playIntro && !authPending)
  const onIntroOut = useCallback(() => setReady(true), [])

  useSmoothScroll()
  useSectionMotion(root, ({ root: el }) => revealOnScroll(el))

  // Positions change when the heading font arrives and when the live lists load.
  // Re-measure once, when all three are in: each re-measure lays out the whole page
  // and blocks the phone for a moment. If something is still missing after 3 s,
  // re-measure with what has arrived, and again as the rest comes in.
  const [fontsReady, setFontsReady] = useState(false)
  const [late, setLate] = useState(false)
  const allIn = Boolean(hubs && support && fontsReady)
  useEffect(() => {
    Promise.resolve(document.fonts?.ready).then(() => setFontsReady(true))
  }, [])
  useEffect(() => {
    if (allIn) return undefined
    const id = setTimeout(() => setLate(true), 3000)
    return () => clearTimeout(id)
  }, [allIn])
  useEffect(() => {
    if (!allIn && !late) return undefined
    const id = setTimeout(() => ScrollTrigger.refresh(), 200)
    return () => clearTimeout(id)
  }, [allIn, late, hubs, support, fontsReady])

  return (
    <div className="landing" ref={root}>
      <Intro play={playIntro} pending={authPending} onOut={onIntroOut} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />

      <main id="main" tabIndex={-1}>
        <Journey ready={ready} />
        <JourneyCard />
        <Beyond />
        <Dimensions />
        <Why />
        <Features supportCount={support?.length} />
        <Stack />
        <Hubs hubs={hubs} support={support} />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
