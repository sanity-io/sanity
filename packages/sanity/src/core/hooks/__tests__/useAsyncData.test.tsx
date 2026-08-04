import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useAsyncData} from '../useAsyncData'

// Fetchers are module-scoped so they keep a stable identity across renders — the exact contract the
// hook requires of real callers (memoize with useCallback), and it avoids a re-fetch loop in the test.
const rejectionError = new Error('nope')
const fetchData = (): Promise<string[]> => Promise.resolve(['a', 'b'])
const fetchEmpty = (): Promise<string[]> => Promise.resolve([])
const fetchRejected = (): Promise<string[]> => Promise.reject(rejectionError)

describe('useAsyncData', () => {
  it('is loading until the fetch resolves, then success with the data', async () => {
    const {result} = renderHook(() => useAsyncData(fetchData))

    expect(result.current.loading).toBe(true)
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual(['a', 'b'])
  })

  it('treats a resolved-but-empty result as settled (loading false), not loading', async () => {
    const {result} = renderHook(() => useAsyncData(fetchEmpty))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual([])
  })

  it('settles to error (loading false) on a rejected fetch', async () => {
    const {result} = renderHook(() => useAsyncData(fetchRejected))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe(rejectionError)
    expect(result.current.data).toBeUndefined()
  })

  it('resets to loading during render when resetKey changes, instead of a false-settled flash', async () => {
    let resolveB!: (value: string[]) => void
    const fetchA = vi.fn((): Promise<string[]> => Promise.resolve(['a']))
    const fetchB = vi.fn((): Promise<string[]> => new Promise((resolve) => (resolveB = resolve)))

    const {result, rerender} = renderHook(
      ({fetcher, resetKey}: {fetcher: () => Promise<string[]>; resetKey: string}) =>
        useAsyncData(fetcher, {resetKey}),
      {initialProps: {fetcher: fetchA, resetKey: 'a'}},
    )

    await waitFor(() => expect(result.current.data).toEqual(['a']))

    // Switching to a different entity (new resetKey) — the previous entity's data must not linger
    // as a false-settled state while the new fetch is in flight.
    rerender({fetcher: fetchB, resetKey: 'b'})
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeUndefined()

    resolveB(['b'])
    await waitFor(() => expect(result.current.data).toEqual(['b']))
  })

  it('keeps stale-while-revalidate when resetKey is unchanged (a same-entity refetch)', async () => {
    let resolveRefetch!: (value: string[]) => void
    const fetchInitial = vi.fn((): Promise<string[]> => Promise.resolve(['a']))
    const fetchRefetch = vi.fn(
      (): Promise<string[]> => new Promise((resolve) => (resolveRefetch = resolve)),
    )

    const {result, rerender} = renderHook(
      ({fetcher}: {fetcher: () => Promise<string[]>}) => useAsyncData(fetcher, {resetKey: 'same'}),
      {initialProps: {fetcher: fetchInitial}},
    )

    await waitFor(() => expect(result.current.data).toEqual(['a']))

    // A new fetcher identity but the same resetKey — same entity, just re-fetching. Old data stays
    // visible (no skeleton flash) until the refetch resolves.
    rerender({fetcher: fetchRefetch})
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual(['a'])

    resolveRefetch(['a', 'b'])
    await waitFor(() => expect(result.current.data).toEqual(['a', 'b']))
  })
})
