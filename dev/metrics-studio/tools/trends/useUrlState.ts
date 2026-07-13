import {useCallback, useState} from 'react'

/**
 * A string state value mirrored to a URL query param, so a chosen data
 * source or time range survives reload and can be shared as a link. Reads
 * the initial value from the current URL; writes update the query string in
 * place (replaceState — no history spam) without touching the studio router.
 */
export function useUrlState(key: string, fallback: string): [string, (next: string) => void] {
  const read = () => {
    if (typeof window === 'undefined') return fallback
    return new URLSearchParams(window.location.search).get(key) ?? fallback
  }
  const [value, setValue] = useState(read)

  const set = useCallback(
    (next: string) => {
      setValue(next)
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (next === fallback) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, next)
      }
      window.history.replaceState(window.history.state, '', url)
    },
    [key, fallback],
  )

  return [value, set]
}
