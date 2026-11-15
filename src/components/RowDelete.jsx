import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { MSG, errorMessage } from '../lib/text.js'

// A Delete button for one row of a list (a meeting, notice or lesson).
// The database (RLS) still decides whether this person may delete it.
export function RowDelete({ table, id, name, confirmText, onDone, onError }) {
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!window.confirm(confirmText)) return
    setBusy(true)
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id')
    setBusy(false)
    if (error) return onError(errorMessage(error))
    if (!data.length) return onError(MSG.notAllowed)
    onDone(id)
  }

  return (
    <button type="button" className="row-delete" onClick={remove} disabled={busy} aria-busy={busy || undefined}>
      <Trash2 size={16} aria-hidden="true" />
      {busy ? 'Deleting…' : 'Delete'}
      <span className="visually-hidden"> {name}</span>
    </button>
  )
}
