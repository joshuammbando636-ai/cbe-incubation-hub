import {
  Bell,
  CircleHelp,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Search,
  Settings,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/context.js'
import { ADMIN_MENU, STAFF_ACTION, STAFF_MENU, STUDENT_ACTION, TAB_COUNT } from '../lib/menus.js'
import { unreadCount } from '../lib/messages.js'
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

// Sign in / sign up: logo top-left (goes home), the form centred on the left,
// a big rounded picture card on the right (on phones: a short strip above the form).
export function AuthShell({ title, sub, line, children }) {
  return (
    <div className="auth">
      <SkipLink />
      <header className="auth-top">
        <Link to="/" className="auth-logo" aria-label={`${APP_NAME}, home`}>
          <span className="brand-mark" aria-hidden="true">
            CBE
          </span>
          <span aria-hidden="true">Incubation Hub</span>
        </Link>
      </header>
      <AuthArt line={line} />
      <main id="main" tabIndex={-1} className="auth-main">
        <div className="auth-box">
          <h1>{title}</h1>
          <p className="auth-sub">{sub}</p>
          {children}
        </div>
      </main>
    </div>
  )
}

// Decoration only: the photo under the blue gradient and one big line.
function AuthArt({ line }) {
  return (
    <aside className="auth-art" aria-hidden="true">
      <p className="auth-art-line">{line}</p>
    </aside>
  )
}

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

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// Messages waiting for this person, checked every 30 seconds while the tab is visible
// and again whenever the page changes (so reading a chat clears the count soon).
function useUnread(userId, pathname) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let stale = false
    const check = () => {
      if (document.visibilityState !== 'visible') return
      unreadCount(userId).then((n) => !stale && setCount(n))
    }
    check()
    const id = setInterval(check, 30000)
    return () => {
      stale = true
      clearInterval(id)
    }
  }, [userId, pathname])
  return count
}

const isMessages = (to) => to.endsWith('/messages')
const shortCount = (n) => (n > 99 ? '99+' : String(n))

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="menu-badge">
      {shortCount(count)}
      <span className="visually-hidden"> unread</span>
    </span>
  )
}

function SideLink({ to, end, label, icon: Icon, collapsed, badge }) {
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}>
      {Icon && <Icon aria-hidden="true" size={20} strokeWidth={1.75} />}
      <span className="sidebar-label">{label}</span>
      <Badge count={badge} />
    </NavLink>
  )
}

// Staff: the search box finds students (it opens the Students page with the words).
function StudentSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const words = q.trim()
    navigate(words ? `/staff/students?q=${encodeURIComponent(words)}` : '/staff/students')
    setQ('')
  }
  return (
    <form role="search" className="top-search" onSubmit={submit}>
      <Search aria-hidden="true" size={18} strokeWidth={1.75} />
      <label htmlFor="top-search" className="visually-hidden">
        Search students
      </label>
      <input
        id="top-search"
        type="search"
        placeholder="Search students…"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </form>
  )
}

// Signed-in pages (Josh's "Drive" reference, 16 Nov 2026):
// - a blue frame around one big white panel with rounded corners;
// - top row: logo, search (staff) or today's date (students), notices,
//   messages, profile, your name and picture, and the button that shrinks the menu;
// - left: the blue sidebar with a rounded top corner: one white action button,
//   the menu, help links and Sign out;
// - phones: the panel fills the screen, the main pages sit in a bar along the
//   bottom and "More" opens the sidebar.
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
  const isStudent = profile.role === 'student'
  const base = isStudent ? '/student' : '/staff'
  const action = isStudent ? STUDENT_ACTION : STAFF_ACTION
  const ActionIcon = action.icon
  const [now] = useState(() => new Date())
  const unread = useUnread(profile.id, pathname)

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

      <div className="panel">
        <header className="top">
          <Link to={base} className="top-brand" aria-label={`${APP_NAME}, dashboard`}>
            <span className="brand-mark" aria-hidden="true">
              CBE
            </span>
            <span className="top-brand-name" aria-hidden="true">
              Incubation Hub
            </span>
          </Link>

          <div className="top-middle">
            {isStudent ? (
              <p className="top-date">
                <span>{WEEKDAY.format(now)}</span>, {DAY.format(now)}
              </p>
            ) : (
              <StudentSearch />
            )}
          </div>

          <nav className="top-icons" aria-label="Shortcuts">
            <Link to={`${base}/notices`} className="top-icon" aria-label="Notices" title="Notices">
              <Bell aria-hidden="true" size={21} strokeWidth={1.75} />
            </Link>
            <Link
              to={`${base}/messages`}
              className="top-icon"
              aria-label={unread ? `Messages, ${shortCount(unread)} unread` : 'Messages'}
              title="Messages"
            >
              <CircleHelp aria-hidden="true" size={21} strokeWidth={1.75} />
              {unread > 0 && <span className="top-dot" aria-hidden="true" />}
            </Link>
            <Link to={`${base}/profile`} className="top-icon top-settings" aria-label="Profile settings" title="Profile settings">
              <Settings aria-hidden="true" size={21} strokeWidth={1.75} />
            </Link>
          </nav>

          <Link to={`${base}/profile`} className="top-me" aria-label={`Your profile: ${name}`}>
            <span className="top-me-name" aria-hidden="true">
              {name}
            </span>
            <Avatar name={profile.full_name} path={profile.photo_path} avatar={profile.avatar} gender={profile.gender} />
          </Link>

          <button
            type="button"
            className="top-icon top-collapse"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Open menu' : 'Minimize menu'}
            title={collapsed ? 'Open menu' : 'Minimize menu'}
          >
            <SlidersHorizontal aria-hidden="true" size={21} strokeWidth={1.75} />
          </button>
        </header>

        <aside id="sidebar" className="sidebar">
          <div className="sidebar-inner">
            <Link to={action.to} className="side-action" title={collapsed ? action.label : undefined}>
              <ActionIcon className="side-action-icon" aria-hidden="true" size={18} strokeWidth={2} />
              <span className="sidebar-label">{action.label}</span>
            </Link>

            {mainItems.length > 0 && (
              <nav className="sidenav" aria-label="Main">
                <ul>
                  {mainItems.map((item) => (
                    <li key={item.to}>
                      <SideLink {...item} collapsed={collapsed} badge={isMessages(item.to) ? unread : 0} />
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="sidebar-foot">
              <p className="side-label sidebar-label">Need help?</p>
              <Link to={`${base}/messages`} className="side-help" title={collapsed ? 'Messages' : undefined}>
                <span className="side-help-head">
                  <MessageCircle aria-hidden="true" size={18} strokeWidth={1.75} />
                  <span className="sidebar-label">Messages</span>
                </span>
                <span className="side-help-line sidebar-label">
                  {unread > 0 ? `${shortCount(unread)} unread` : isStudent ? 'Ask your mentor' : 'Talk to your students'}
                </span>
              </Link>
              <Link to={`${base}/notices`} className="side-help" title={collapsed ? 'Notices' : undefined}>
                <span className="side-help-head">
                  <Megaphone aria-hidden="true" size={18} strokeWidth={1.75} />
                  <span className="sidebar-label">Notices</span>
                </span>
                <span className="side-help-line sidebar-label">Meetings and news from your hub</span>
              </Link>
              <button type="button" className="signout" onClick={signOut} title={collapsed ? 'Sign out' : undefined}>
                <span className="sidebar-label">Sign out</span>
                <LogOut aria-hidden="true" size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </aside>

        <main id="main" tabIndex={-1} ref={mainRef} className="main">
          <Notifications />
          <Outlet />
        </main>
      </div>

      {tabs.length > 0 && (
        <nav className="tabbar" aria-label="Quick menu">
          {tabs.map(({ to, end, label, short, icon: Icon }) => (
            <NavLink key={to} to={to} end={end}>
              {Icon && <Icon aria-hidden="true" size={22} strokeWidth={1.75} />}
              <span>{short ?? label}</span>
              {isMessages(to) && <Badge count={unread} />}
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
