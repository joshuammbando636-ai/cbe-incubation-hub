// The Messages page renders for a student and for staff without a database
// (the lists load in effects, after render).
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'

let Messages
let AuthContext

beforeAll(async () => {
  vi.stubGlobal('window', {
    location: { hash: '', search: '', origin: 'http://localhost' },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  })
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder')
  ;({ Messages } = await import('../src/pages/Messages.jsx'))
  ;({ AuthContext } = await import('../src/auth/context.js'))
})

const render = (role, url = '/student/messages') =>
  renderToString(
    <AuthContext.Provider value={{ profile: { id: 'u1', role, full_name: 'Test Person' } }}>
      <MemoryRouter initialEntries={[url]}>
        <Messages />
      </MemoryRouter>
    </AuthContext.Provider>,
  )

describe('messages page', () => {
  it('shows the list side with New message', () => {
    const html = render('student')
    expect(html).toContain('<h1 class="msg-title">Messages</h1>')
    expect(html).toContain('New message')
  })

  it('opens the chat side when a person is chosen', () => {
    const html = render('mentor', '/staff/messages?with=abc')
    expect(html).toContain('msg-page has-thread')
  })
})
