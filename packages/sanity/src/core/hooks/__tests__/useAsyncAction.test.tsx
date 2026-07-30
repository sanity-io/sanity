import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useAsyncAction} from '../useAsyncAction'

describe('useAsyncAction', () => {
  it('runs the action and toggles isRunning around it', async () => {
    let resolve!: () => void
    const fn = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const {result} = renderHook(() => useAsyncAction(fn))

    expect(result.current.isRunning).toBe(false)

    act(() => {
      void result.current.run()
    })
    await waitFor(() => expect(result.current.isRunning).toBe(true))
    expect(fn).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve()
    })
    await waitFor(() => expect(result.current.isRunning).toBe(false))
  })

  it('blocks re-entry: a second call while running does not start the action again', async () => {
    let resolve!: () => void
    const fn = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const {result} = renderHook(() => useAsyncAction(fn))

    // Two calls in the same tick — the synchronous ref guard must reject the second.
    await act(async () => {
      void result.current.run()
      void result.current.run()
    })
    expect(fn).toHaveBeenCalledTimes(1)

    // Settle the in-flight run so nothing is left pending.
    await act(async () => {
      resolve()
    })
    await waitFor(() => expect(result.current.isRunning).toBe(false))
  })

  it('routes a rejected action to onError and still releases isRunning', async () => {
    const error = new Error('boom')
    const fn = vi.fn(() => Promise.reject(error))
    const onError = vi.fn()
    const {result} = renderHook(() => useAsyncAction(fn, {onError}))

    await act(async () => {
      await result.current.run()
    })

    expect(onError).toHaveBeenCalledWith(error)
    expect(result.current.isRunning).toBe(false)
  })
})
