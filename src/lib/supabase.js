import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Email links (confirm, reset) put their result in the URL. The client reads and
// clears it while starting up, so keep a copy for the pages that need to show
// "that link did not work". Read before createClient runs.
export const landingUrl = {
  hash: new URLSearchParams(window.location.hash.slice(1)),
  query: new URLSearchParams(window.location.search),
}

export function landingError() {
  return (
    landingUrl.hash.get('error_code') ||
    landingUrl.hash.get('error') ||
    landingUrl.query.get('error_code') ||
    landingUrl.query.get('error') ||
    ''
  )
}

// null when the .env keys are missing; App shows "Setup needed" instead.
// flowType 'implicit': a student may sign up on a laptop and open the email on
// a phone. PKCE links only work in the browser that asked for them.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, { auth: { flowType: 'implicit' } })
    : null

export const authRedirect = (path) => `${window.location.origin}${path}`
