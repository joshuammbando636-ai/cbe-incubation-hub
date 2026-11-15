// Landing page v2: renders without crashing and carries the agreed wording.
// No Supabase project is needed: the hub lists load in an effect, after render.
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'

let Landing

beforeAll(async () => {
  vi.stubGlobal('window', {
    location: { hash: '', search: '', origin: 'http://localhost' },
    // Reduced motion: no intro sheet, so the page itself is what renders.
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

describe('landing page v2', () => {
  it('has one h1 that reads as one sentence', () => {
    const html = render()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('<span class="visually-hidden">Turn your idea into a business.</span>')
  })

  it('shows every section in order', () => {
    const html = render()
    const order = [
      'Every idea needs a hub.',
      'Beyond the idea',
      'Open new doors for your business.',
      'We all have a why.',
      'Everything you need at every stage',
      'Your Hub at a glance',
      'Find the hub that fits your idea',
      'id="faq"',
      'Ready to start your business?',
    ]
    const at = order.map((t) => html.indexOf(t))
    expect(at.every((i) => i > 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })

  it('sends visitors to sign up and sign in', () => {
    const html = render()
    expect(html).toContain('href="/signup"')
    expect(html).toContain('href="/login"')
    expect(html).toContain('aria-label="Create your account"')
  })

  it('gives a number to call with questions', () => {
    const html = render()
    expect(html).toContain('href="tel:+255777561651"')
    expect(html).toContain('0777 561 651')
  })

  it('never shows placeholder text', () => {
    const html = render()
    expect(html).not.toContain('[confirm with CBE]')
    expect(html).not.toContain('Does it cost anything?')
  })
})
