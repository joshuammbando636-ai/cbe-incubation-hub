import { Link } from 'react-router'
import { SimplePage } from '../components/layouts.jsx'
import { useTitle } from '../lib/useTitle.js'

export function NotFound() {
  useTitle('Page not found')
  return (
    <SimplePage>
      <h1>Page not found</h1>
      <p className="lede">This page does not exist or has moved.</p>
      <p>
        <Link to="/" className="link-btn">
          Go to the start page
        </Link>
      </p>
    </SimplePage>
  )
}

// Shown instead of the whole app when the .env keys are missing.
// No router or Supabase here, so no links.
export function SetupNeeded() {
  useTitle('Setup needed')
  return (
    <div className="page">
      <main className="main narrow">
        <h1>Setup needed</h1>
        <p className="lede">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file, then restart the app.
        </p>
      </main>
    </div>
  )
}
