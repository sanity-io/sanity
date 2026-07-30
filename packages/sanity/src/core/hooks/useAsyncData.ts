import {useEffect, useState} from 'react'

/**
 * The three distinct states of an async read. Crucially, `success` covers a resolved-but-empty
 * result (e.g. `[]`) — that is NOT loading, it is settled with nothing to show.
 */
export type AsyncData<T> =
  | {status: 'loading'; data: undefined; error: undefined}
  | {status: 'success'; data: T; error: undefined}
  | {status: 'error'; data: undefined; error: unknown}

/**
 * Runs `fetcher` and models the result as three distinct states — loading, success, error — so a
 * settled-but-empty result never reads as "still loading". `loading` is true ONLY until the first
 * resolution; once settled (with data, an empty value, OR an error) it stays false.
 *
 * This is the counterpart to the null-vs-empty bug class: representing "not yet fetched" and
 * "fetched, nothing there" with the same value forces a permanent skeleton onto empty / failed
 * fetches. Modelling the states explicitly makes that impossible.
 *
 * Re-runs whenever `fetcher`'s identity changes — memoize it with `useCallback` on its real inputs.
 * A resolution that arrives after unmount, or after a newer run superseded it, is ignored. On a
 * re-run the previous state is kept until the new fetch resolves (stale-while-revalidate), avoiding
 * a skeleton flash on refetch.
 *
 * @internal
 */
export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncData<T> & {loading: boolean} {
  const [state, setState] = useState<AsyncData<T>>({
    status: 'loading',
    data: undefined,
    error: undefined,
  })

  useEffect(() => {
    let cancelled = false
    // setState only happens in the async resolution (not synchronously in the effect body), so the
    // React Compiler is satisfied and a superseded/unmounted run cannot write stale state.
    fetcher()
      .then((data) => {
        if (!cancelled) setState({status: 'success', data, error: undefined})
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({status: 'error', data: undefined, error})
      })
    return () => {
      cancelled = true
    }
  }, [fetcher])

  return {...state, loading: state.status === 'loading'}
}
