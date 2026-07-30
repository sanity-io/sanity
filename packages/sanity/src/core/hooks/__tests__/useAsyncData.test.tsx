import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

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
})
