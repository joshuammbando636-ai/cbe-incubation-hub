import Lenis from 'lenis'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useTitle } from '../lib/useTitle.js'
import { FinalCta, Footer } from './landing/Closing.jsx'
import { Faq } from './landing/Faq.jsx'
import { Features } from './landing/Features.jsx'
import { Header } from './landing/Header.jsx'
import { Hero } from './landing/Hero.jsx'
import { Hubs } from './landing/Hubs.jsx'
import { Intro } from './landing/Intro.jsx'
import { Questions } from './landing/Questions.jsx'
import { Scattered } from './landing/Scattered.jsx'
import { Stack } from './landing/Stack.jsx'
import { Tiles } from './landing/Tiles.jsx'
import { WhatIsHub } from './landing/WhatIsHub.jsx'
import {
  gsap,
  prefersReducedMotion,
  revealOnScroll,
  ScrollTrigger,
  setLenis,
  shouldPlayIntro,
  useSectionMotion,
} from './landing/motion.js'
import './landing.css'

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
// sticky elements, ScrollTrigger and the keyboard keep working.
function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
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
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])
  useEffect(() => {
    if (!hubs && !support) return undefined
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [hubs, support])

  return (
    <div className="landing" ref={root}>
      <Intro play={playIntro} pending={authPending} onOut={onIntroOut} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />

      <main id="main" tabIndex={-1}>
        <Hero ready={ready} />
        <WhatIsHub />
        <Questions />
        <Tiles />
        <Scattered />
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
