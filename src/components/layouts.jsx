import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/context.js'
import { ADMIN_MENU, STAFF_MENU } from '../lib/menus.js'
import { APP_NAME, FOOTER } from '../lib/text.js'
import { Notifications } from './Notifications.jsx'

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

const ROLE_NAME = { student: 'Student', mentor: 'Mentor', admin: 'Admin' }

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase() || '?'
}

// Signed-in pages: a menu down the left (a slide-out drawer on phones), then the page.
export function AppShell({ menu = [] }) {
  const { profile, signOut } = useAuth()
  const mainRef = useNewPageFocus()
  const { pathname } = useLocation()
  // The drawer remembers the page it was opened on, so choosing another page closes it.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname
  const toggle = () => setOpenOn(open ? null : pathname)
  const close = () => setOpenOn(null)
  const menuButton = useRef(null)
  const name = profile.full_name || profile.email

  // Escape closes the drawer and puts focus back on the menu button.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenOn(null)
      menuButton.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`shell${open ? ' is-open' : ''}`}>
      <SkipLink />

      <header className="mobilebar">
        <button
          ref={menuButton}
          type="button"
          className="icon-button"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={toggle}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className="visually-hidden">Menu</span>
        </button>
        <Link to="/" className="wordmark">
          {APP_NAME}
        </Link>
      </header>

      <div className="scrim" aria-hidden="true" onClick={close} />

      <aside id="sidebar" className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            CBE
          </span>
          <span>Incubation Hub</span>
        </Link>

        {menu.length > 0 && (
          <nav className="sidenav" aria-label="Main">
            <ul>
              {menu.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={end}>
                    {Icon && <Icon aria-hidden="true" size={20} strokeWidth={1.75} />}
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="sidebar-foot">
          <div className="me">
            <span className="avatar" aria-hidden="true">
              {initials(profile.full_name)}
            </span>
            <span className="me-text">
              <span className="me-name">{name}</span>
              <span className="me-role">{ROLE_NAME[profile.role] ?? ''}</span>
            </span>
          </div>
          <button type="button" className="signout" onClick={signOut}>
            <LogOut aria-hidden="true" size={18} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="shell-body">
        <main id="main" tabIndex={-1} ref={mainRef} className="main">
          <Notifications />
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

// Mentors and admins share these pages; admins get two more menu items.
export function StaffShell() {
  const { profile } = useAuth()
  return <AppShell menu={profile.role === 'admin' ? ADMIN_MENU : STAFF_MENU} />
}
