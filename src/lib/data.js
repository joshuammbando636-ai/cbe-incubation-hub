import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Pages already seen this visit, so going back to one shows it at once.
// Only for read-only pages: a page that copies its data into a form should not pass a key.
const pageCache = new Map()

// Call on sign-out, so the next person never sees the last one's pages.
export function forgetPages() {
  pageCache.clear()
}

// Runs an async loader and tracks its result. `reload` runs it again.
// The loader should throw on a Supabase error (see `must`).
// With a `cacheKey`, a page seen before shows its last data straight away
// while fresh data loads quietly behind it.
export function useLoad(loader, deps, cacheKey) {
  const [state, setState] = useState(() =>
    cacheKey && pageCache.has(cacheKey)
      ? { data: pageCache.get(cacheKey), error: null, loading: false }
      : { data: null, error: null, loading: true },
  )
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  useEffect(() => {
    let stale = false
    const shown = cacheKey && pageCache.has(cacheKey)
    setState(
      shown
        ? { data: pageCache.get(cacheKey), error: null, loading: false }
        : (s) => ({ ...s, loading: true, error: null }),
    )
    run()
      .then((data) => {
        if (cacheKey) pageCache.set(cacheKey, data)
        if (!stale) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        // Keep showing the earlier data if the quiet refresh fails.
        if (!stale && !shown) setState({ data: null, error, loading: false })
      })
    return () => {
      stale = true
    }
  }, [run, round, cacheKey])

  const reload = useCallback(() => setRound((n) => n + 1), [])
  return { ...state, reload }
}

// Unwraps a Supabase response, throwing its error.
export function must({ data, error }) {
  if (error) throw error
  return data
}

// The dropdown lists. Loaded once per visit; they rarely change.
let listsPromise = null

export function loadLists() {
  if (!listsPromise) {
    const byName = (table) => supabase.from(table).select('*').order('name').then(must)
    listsPromise = Promise.all([
      byName('campuses'),
      byName('departments'),
      byName('programmes'),
      supabase.from('study_levels').select('*').order('position').then(must),
      byName('clusters'),
      byName('hubs'),
      byName('sectors'),
      byName('support_types'),
    ]).then(([campuses, departments, programmes, levels, clusters, hubs, sectors, supportTypes]) => ({
      campuses,
      departments,
      programmes,
      levels,
      clusters,
      hubs,
      sectors,
      supportTypes,
    }))
    listsPromise.catch(() => {
      listsPromise = null // let the next attempt try again
    })
  }
  return listsPromise
}

// Call after an admin edits a list.
export function forgetLists() {
  listsPromise = null
}

export const nameOf = (list, id) => list?.find((x) => x.id === id)?.name ?? ''
