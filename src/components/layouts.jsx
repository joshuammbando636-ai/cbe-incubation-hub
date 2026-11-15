import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/context.js'
import { ADMIN_MENU, STAFF_MENU } from '../lib/menus.js'
import { APP_NAME, FOOTER } from '../lib/text.js'

export function Footer() {
  return <footer className="footer">{FOOTER}</footer>
}

// Keyboard users can jump past the menu straight to the page.
function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      Skip to content
    </a>
  )
}

// On a new page: scroll to the top and move focus to the page, so screen
// readers start reading the new page instead of staying on the old link.
function useNewPageFocus() {
  const { pathname } = useLocation()
  const ref = useRef(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, 0)
    ref.current?.focus({ preventScroll: true })
  }, [pathname])
  return ref
}

// Narrow single-column page for signed-out screens and simple messages.
export function SimplePage({ children }) {
  return (
    <div className="page">
      <SkipLink />
      <header className="topbar">
        <Link to="/" className="wordmark">
          {APP_NAME}
        </Link>
      </header>
      <main id="main" tabIndex={-1} className="main narrow">
        {children}
      </main>
      <Footer />
    </div>
  )
}

// Signed-in pages: wordmark, account area, menu, then the page.
export function AppShell({ menu = [] }) {
  const { profile, signOut } = useAuth()
  const mainRef = useNewPageFocus()
  return (
    <div className="page">
      <SkipLink />
      <header className="topbar">
        <Link to="/" className="wordmark">
          {APP_NAME}
        </Link>
        <div className="account">
          <span className="account-name">{profile.full_name || profile.email}</span>
          <span aria-hidden="true"> · </span>
          <button type="button" className="link-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      {menu.length > 0 && (
        <nav className="menu" aria-label="Main">
          <ul>
            {menu.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main id="main" tabIndex={-1} ref={mainRef} className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// Mentors and admins share these pages; admins get two more menu items.
export function StaffShell() {
  const { profile } = useAuth()
  return <AppShell menu={profile.role === 'admin' ? ADMIN_MENU : STAFF_MENU} />
}
