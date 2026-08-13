import {useCallback, useEffect, useState} from 'react'

/**
 * A string state value mirrored to a URL query param, so a chosen data
 * source or time range survives reload and can be shared as a link. Reads
 * the initial value from the current URL; writes update the query string
 * without touching the studio router.
 *
 * The setter's second arg picks the history mode: 'replace' (default — no
 * history spam, right for filters/toggles) or 'push' (a real history entry,
 * right for navigation like jumping to a metric's tab, so Back returns). A
 * popstate listener keeps the value in sync when the user navigates history.
 */
export function useUrlState(
  key: string,
  fallback: string,
): [string, (next: string, mode?: 'replace' | 'push') => void] {
  const read = () => {
    if (typeof window === 'undefined') return fallback
    return new URLSearchParams(window.location.search).get(key) ?? fallback
  }
  const [value, setValue] = useState(read)

  // Reflect Back/Forward navigation (pushState entries) back into state.
  useEffect(() => {
    const onPopState = () => setValue(read())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback])

  const set = useCallback(
    (next: string, mode: 'replace' | 'push' = 'replace') => {
      setValue(next)
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (next === fallback) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, next)
      }
      if (mode === 'push') window.history.pushState(window.history.state, '', url)
      else window.history.replaceState(window.history.state, '', url)
    },
    [key, fallback],
  )

  return [value, set]
}
