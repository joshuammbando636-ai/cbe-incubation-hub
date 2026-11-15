import { Bell, ChevronRight, LogOut, Megaphone, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/context.js'
import { ADMIN_MENU, STAFF_ACTION, STAFF_MENU, STUDENT_ACTION, TAB_COUNT } from '../lib/menus.js'
import { APP_NAME, FOOTER } from '../lib/text.js'
import { Avatar } from './Avatar.jsx'
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

// Computers only: the sidebar can shrink to icons. Remembered on this browser.
const COLLAPSE_KEY = 'cbe-sidebar-collapsed'
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        /* private window: just don't remember */
      }
      return !c
    })
  return [collapsed, toggle]
}

// The menu item for this page, for the title in the top bar.
function pageFor(menu, pathname) {
  return (
    menu.find((item) => item.to === pathname) ??
    menu.filter((item) => !item.end && pathname.startsWith(`${item.to}/`)).sort((a, b) => b.to.length - a.to.length)[0]
  )
}

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function SideLink({ to, end, label, icon: Icon, collapsed }) {
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}>
      {Icon && <Icon aria-hidden="true" size={20} strokeWidth={1.75} />}
      <span className="sidebar-label">{label}</span>
    </NavLink>
  )
}

// Signed-in pages (layout from Josh's Pitch.io reference):
// - left: white sidebar with the logo, one big action button, the menu, a help card
//   and Sign out. The current page's tab joins the page on its right.
// - top: page name and today's date, then notices and your name (opens Profile).
// - phones: the main pages sit in a bar along the bottom; "More" opens the sidebar.
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
  const [collapsed, toggleCollapsed] = useCollapsed()
  const name = profile.full_name || profile.email
  const mainItems = menu.filter((item) => !item.foot)
  const tabs = mainItems.slice(0, TAB_COUNT)
  const base = profile.role === 'student' ? '/student' : '/staff'
  const action = profile.role === 'student' ? STUDENT_ACTION : STAFF_ACTION
  const ActionIcon = action.icon
  const page = pageFor(menu, pathname)
  const [now] = useState(() => new Date())

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
    <div className={`shell${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
      <SkipLink />

      <div className="scrim" aria-hidden="true" onClick={close} />

      <aside id="sidebar" className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="sidebar-brand" aria-label={APP_NAME}>
            <span className="brand-mark" aria-hidden="true">
              CBE
            </span>
            <span className="sidebar-label">Incubation Hub</span>
          </Link>
          <button
            type="button"
            className="collapse-button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Open menu' : 'Minimize menu'}
            title={collapsed ? 'Open menu' : 'Minimize menu'}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" size={20} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={20} strokeWidth={1.75} />
            )}
          </button>
        </div>

        <Link to={action.to} className="side-action" title={collapsed ? action.label : undefined}>
          <span className="sidebar-label">{action.label}</span>
          <span className="side-action-icon" aria-hidden="true">
            <ActionIcon size={20} strokeWidth={2} />
          </span>
        </Link>

        {mainItems.length > 0 && (
          <nav className="sidenav" aria-label="Main">
            <ul>
              {mainItems.map((item) => (
                <li key={item.to}>
                  <SideLink {...item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="sidebar-foot">
          <div className="help-card sidebar-label">
            <span className="help-icon" aria-hidden="true">
              <Megaphone size={22} strokeWidth={1.75} />
            </span>
            <p>Meetings and news from your hub are in Notices.</p>
            <Link to={`${base}/notices`}>Open notices</Link>
          </div>
          <button type="button" className="signout" onClick={signOut} title={collapsed ? 'Sign out' : undefined}>
            <LogOut aria-hidden="true" size={18} strokeWidth={1.75} />
            <span className="sidebar-label">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="shell-body">
        <header className="apptop">
          <Link to="/" className="apptop-brand brand-mark" aria-label={APP_NAME}>
            CBE
          </Link>
          <div className="apptop-page">
            <p className="apptop-title">{page?.label ?? ''}</p>
            <p className="apptop-date">
              <span>{WEEKDAY.format(now)}</span>, {DAY.format(now)}
            </p>
          </div>
          <Link to={`${base}/notices`} className="icon-button apptop-bell" aria-label="Notices">
            <Bell aria-hidden="true" size={20} strokeWidth={1.75} />
          </Link>
          <Link to={`${base}/profile`} className="apptop-me" aria-label={`Your profile: ${name}`}>
            <Avatar
              name={profile.full_name}
              path={profile.photo_path}
              avatar={profile.avatar}
              gender={profile.gender}
            />
            <span className="apptop-me-text" aria-hidden="true">
              <span className="me-name">{name}</span>
              <span className="me-role">{ROLE_NAME[profile.role] ?? ''}</span>
            </span>
            <ChevronRight className="apptop-chevron" aria-hidden="true" size={16} />
          </Link>
        </header>

        <main id="main" tabIndex={-1} ref={mainRef} className="main">
          <Notifications />
          <Outlet />
        </main>
        <Footer />
      </div>

      {tabs.length > 0 && (
        <nav className="tabbar" aria-label="Quick menu">
          {tabs.map(({ to, end, label, short, icon: Icon }) => (
            <NavLink key={to} to={to} end={end}>
              {Icon && <Icon aria-hidden="true" size={22} strokeWidth={1.75} />}
              <span>{short ?? label}</span>
            </NavLink>
          ))}
          <button
            ref={menuButton}
            type="button"
            className={open ? 'active' : undefined}
            aria-expanded={open}
            aria-controls="sidebar"
            onClick={toggle}
          >
            <Menu aria-hidden="true" size={22} strokeWidth={1.75} />
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  )
}

// Mentors and admins share these pages; admins get two more menu items.
export function StaffShell() {
  const { profile } = useAuth()
  return <AppShell menu={profile.role === 'admin' ? ADMIN_MENU : STAFF_MENU} />
}
