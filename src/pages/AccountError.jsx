import { useAuth } from '../auth/context.js'
import { SimplePage } from '../components/layouts.jsx'
import { Button } from '../components/ui.jsx'
import { useTitle } from '../lib/useTitle.js'

export function AccountError() {
  useTitle('We could not load your account')
  const { reload, signOut } = useAuth()
  return (
    <SimplePage>
      <h1>We could not load your account</h1>
      <p className="lede">Try again in a moment. If this keeps happening, tell your mentor.</p>
      <div className="actions">
        <Button type="button" onClick={reload}>
          Try again
        </Button>
        <Button type="button" variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </SimplePage>
  )
}
