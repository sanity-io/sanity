import {useEffect, useState} from 'react'

/**
 * The three distinct states of an async read. Crucially, `success` covers a resolved-but-empty
 * result (e.g. `[]`) — that is NOT loading, it is settled with nothing to show.
 */
export type AsyncData<T> =
  | {status: 'loading'; data: undefined; error: undefined}
  | {status: 'success'; data: T; error: undefined}
  | {status: 'error'; data: undefined; error: unknown}

const LOADING_STATE = {status: 'loading', data: undefined, error: undefined} as const

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
 * Pass `resetKey` when a re-run means "this is now a genuinely different entity" rather than "the
 * same entity, refetching" — e.g. a document/version id, not a cache-busting counter. Stale-while-
 * revalidate is the wrong default there: showing entity A's data under entity B's identity is a
 * false-settled flash, not a smooth refetch. When `resetKey` changes, state resets to loading during
 * render (before the new fetch settles) instead of holding the previous entity's data.
 *
 * @internal
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options?: {resetKey?: string},
): AsyncData<T> & {loading: boolean} {
  const [state, setState] = useState<AsyncData<T>>(LOADING_STATE)

  const resetKey = options?.resetKey
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== undefined && resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setState(LOADING_STATE)
  }

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
