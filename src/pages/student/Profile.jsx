import { useAuth } from '../../auth/context.js'
import { ProfileForm } from '../../components/ProfileForm.jsx'
import { LoadError, Spinner } from '../../components/ui.jsx'
import { loadLists, must, useLoad } from '../../lib/data.js'
import { supabase } from '../../lib/supabase.js'
import { useTitle } from '../../lib/useTitle.js'

async function loadProfilePage(userId) {
  const [lists, profile, support] = await Promise.all([
    loadLists(),
    supabase.from('profiles').select('*').eq('id', userId).single().then(must),
    supabase.from('student_support').select('support_type_id').eq('student_id', userId).then(must),
  ])
  return { lists, profile, support: support.map((r) => r.support_type_id) }
}

export function Profile() {
  useTitle('Your profile')
  const { profile: me, updateProfile } = useAuth()
  const page = useLoad(() => loadProfilePage(me.id), [me.id])

  if (page.loading) return <Spinner />
  if (page.error) return <LoadError error={page.error} onRetry={page.reload} />
  return (
    <div className="narrow-content">
      <h1>Your profile</h1>
      <p className="lede">CBE uses these details for the incubation register. Keep them correct.</p>
      <ProfileForm
        key={page.data.profile.id}
        {...page.data}
        onSaved={(patch) => updateProfile({ full_name: patch.full_name })}
      />
    </div>
  )
}
