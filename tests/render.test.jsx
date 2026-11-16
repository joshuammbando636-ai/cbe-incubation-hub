// Renders screens to HTML to catch crashes and check the wording.
// No Supabase project is needed: these screens render before any data call.
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'

let ui, Login, Signup, NotFound, AuthContext

beforeAll(async () => {
  vi.stubGlobal('window', { location: { hash: '', search: '', origin: 'http://localhost' } })
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder')
  ui = await import('../src/components/ui.jsx')
  ;({ Login } = await import('../src/pages/Login.jsx'))
  ;({ Signup } = await import('../src/pages/Signup.jsx'))
  ;({ NotFound } = await import('../src/pages/SimpleScreens.jsx'))
  ;({ AuthContext } = await import('../src/auth/context.js'))
})

const render = (el) =>
  renderToString(
    <AuthContext.Provider value={{ status: 'signed-out', profile: null }}>
      <MemoryRouter>{el}</MemoryRouter>
    </AuthContext.Provider>,
  )

describe('signed-out screens', () => {
  it('sign in', () => {
    const html = render(<Login />)
    expect(html).toContain('Turn your idea into a business.')
    expect(html).toContain('Forgot your password?')
    expect(html).toContain('href="/signup"')
  })

  it('create account', () => {
    const html = render(<Signup />)
    expect(html).toContain('Create your account')
    expect(html).toContain('Your real first and last name, as on your CBE registration.')
  })

  it('not found', () => {
    expect(render(<NotFound />)).toContain('Page not found')
  })

  it('every page frame starts with a skip link to the content', async () => {
    const { SimplePage } = await import('../src/components/layouts.jsx')
    const html = render(<SimplePage>Hi</SimplePage>)
    expect(html).toMatch(/^<div class="page"><a class="skip-link" href="#main">Skip to content<\/a>/)
    expect(html).toContain('<main id="main" tabindex="-1"')
  })
})

describe('shared pieces', () => {
  it('stage tracker marks the current stage', () => {
    const html = render(<ui.StageTracker stage="operational" />)
    expect(html).toMatch(/class="is-current" aria-current="step">Operational/)
    expect(html.match(/is-done/g)).toHaveLength(2)
  })

  it('video links follow the rules for bad links', () => {
    expect(render(<ui.VideoLink url="https://youtu.be/dQw4w9WgXcQ" />)).toContain('>Watch video<')
    expect(render(<ui.VideoLink url="https://example.com/v" />)).toContain('Watch video (opens in a new tab)')
    const bad = render(<ui.VideoLink url="javascript:alert(1)" />)
    expect(bad).toContain('This link cannot be opened.')
    expect(bad).not.toContain('href')
  })

  it('Download Excel button renders without loading ExcelJS', async () => {
    const { DownloadExcel } = await import('../src/components/DownloadExcel.jsx')
    const html = render(<DownloadExcel isAdmin={false} hubs={[]} />)
    expect(html).toContain('>Download Excel<')
    expect(html).not.toContain('Could not make the file')
  })

  it('dropdowns start with Choose…', () => {
    const html = render(<ui.SelectField id="x" label="Campus" options={[{ value: '1', label: 'Mwanza' }]} value="" onChange={() => {}} />)
    expect(html).toMatch(/<select[^>]*><option value=""[^>]*>Choose…<\/option>/)
  })
})

describe('signed-in frame (Drive layout)', () => {
  const shell = async (profile, path) => {
    const { AppShell, StaffShell } = await import('../src/components/layouts.jsx')
    const { STUDENT_MENU } = await import('../src/lib/menus.js')
    return renderToString(
      <AuthContext.Provider value={{ status: 'ready', profile, signOut() {} }}>
        <MemoryRouter initialEntries={[path]}>
          {profile.role === 'student' ? <AppShell menu={STUDENT_MENU} /> : <StaffShell />}
        </MemoryRouter>
      </AuthContext.Provider>,
    )
  }

  it('student: skip link first, white action button, today in the top row, no search', async () => {
    const html = await shell({ id: 'u1', role: 'student', full_name: 'Amina Hassan', email: 'a@example.com' }, '/student')
    expect(html).toMatch(/^<div class="shell"><a class="skip-link" href="#main">/)
    expect(html).toContain('class="side-action"')
    expect(html).toContain('Post an update')
    expect(html).toContain('class="top-date"')
    expect(html).not.toContain('Search students')
    expect(html).toContain('Sign out')
  })

  it('staff: the top search finds students', async () => {
    const html = await shell({ id: 'u2', role: 'mentor', full_name: 'Grace Mushi', email: 'g@example.com' }, '/staff')
    expect(html).toContain('role="search"')
    expect(html).toContain('Search students')
    expect(html).toContain('Review videos')
    expect(html).not.toContain('class="top-date"')
  })
})
