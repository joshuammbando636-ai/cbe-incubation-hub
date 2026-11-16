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

describe('front page', () => {
  it('has one h1 that reads as one sentence', () => {
    const html = render()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('<span class="visually-hidden">Turn your idea into a business.</span>')
  })

  it('shows every section in order', () => {
    const html = render()
    const order = [
      'Every idea needs a hub.',
      'help',
      'hubs. One for every kind of idea.',
      'into a business.',
      'One place to grow your business.',
      'From idea to income,',
      'Your hub, your mentor and your next step, in one place.',
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
    expect(html).toContain('Create your account')
  })

  it('names all 22 hubs once in the sliding rows', () => {
    const html = render()
    expect(html.match(/<ul class="h-hubs__row/g)).toHaveLength(2)
    expect(html).toContain('<li>FinTech Innovation</li>')
    expect(html).toContain('<li>Measurement &amp; Automation</li>')
    expect(html.match(/<li>[^<]+<\/li>/g).length).toBeGreaterThanOrEqual(22)
  })

  it('gives a number to call with questions', () => {
    const html = render()
    expect(html).toContain('href="tel:+255627375912"')
    expect(html).toContain('+255 627 375 912')
  })

  it('never shows placeholder text', () => {
    const html = render()
    expect(html).not.toContain('[confirm with CBE]')
    expect(html).not.toContain('Does it cost anything?')
  })
})
