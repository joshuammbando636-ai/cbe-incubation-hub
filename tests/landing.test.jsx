// Front page (rebuilt 16 Nov 2026): renders without crashing, keeps Josh's navbar and
// carries the agreed wording. No Supabase project is needed.
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'

let Landing

beforeAll(async () => {
  vi.stubGlobal('window', {
    location: { hash: '', search: '', origin: 'http://localhost' },
    // Reduced motion: no loader, so the page itself is what renders.
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  })
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder')
  ;({ Landing } = await import('../src/pages/Landing.jsx'))
})

const render = () =>
  renderToString(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  )

describe('front page', () => {
  it('has one h1, the hero sentence', () => {
    const html = render()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toMatch(/<h1[^>]*>Turn your idea into a real business\./)
  })

  it('shows every section in order', () => {
    const html = render()
    const order = ['id="top"', 'id="about"', 'id="how"', 'id="stages"', 'id="faq"', 'class="dc-footer"']
    const at = order.map((t) => html.indexOf(t))
    expect(at.every((i) => i > 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })

  it('keeps the two-pill navbar, and every link in it lands on a section', () => {
    const html = render()
    expect(html).toContain('class="b-nav"')
    expect(html).toContain('class="b-nav__toggle"')
    expect(html).toContain('class="b-nav__right"')
    const targets = [...html.matchAll(/class="b-nav__(?:links|drop)[\s\S]*?<\/nav>/g)]
      .flatMap((m) => [...m[0].matchAll(/href="#([a-z]+)"/g)].map((h) => h[1]))
    expect(targets.length).toBeGreaterThanOrEqual(8)
    for (const id of targets) expect(html).toContain(`id="${id}"`)
  })

  it('sends visitors to sign up and sign in', () => {
    const html = render()
    expect(html).toContain('href="/signup"')
    expect(html).toContain('href="/login"')
    expect(html).toContain('Create your account')
  })

  it('has four steps, four stages and six questions', () => {
    const html = render()
    expect(html.match(/class="dc-step"/g)).toHaveLength(4)
    expect(html.match(/class="dc-stages__item/g)).toHaveLength(4)
    expect(html.match(/class="dc-faq__item/g)).toHaveLength(6)
    for (const stage of ['Idea', 'Prototype', 'Operational', 'Earning']) expect(html).toContain(`>${stage}</button>`)
  })

  it('gives a number to call with questions', () => {
    const html = render()
    expect(html).toContain('href="tel:+255627375912"')
    expect(html).toContain('+255 627 375 912')
  })

  it('never shows placeholder text or the reference site', () => {
    const html = render()
    expect(html).not.toMatch(/TODO|lorem|davide|carusio/i)
    expect(html).not.toContain('Does it cost anything?')
  })
})
