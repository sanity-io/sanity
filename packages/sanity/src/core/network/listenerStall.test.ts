import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import type * as ListenerStallExports from './listenerStall'

const setStalledMock = vi.fn()

vi.mock('./studioTabs', () => ({setStalled: setStalledMock}))

type ListenerCountModule = typeof ListenerCountExports
type ListenerStallModule = typeof ListenerStallExports

function pendingFetch(): {resolve: (response: Response) => void} {
  let resolve: ((response: Response) => void) | undefined
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise((resolvePromise) => {
        resolve = resolvePromise
      }),
  )
  return {
    resolve: (response) => resolve?.(response),
  }
}

describe('listener stall detection', () => {
  let listenerCount: ListenerCountModule
  let listenerStall: ListenerStallModule

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    setStalledMock.mockClear()
    vi.stubGlobal('fetch', vi.fn())
    listenerCount = await import('./listenerCount')
    listenerStall = await import('./listenerStall')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('detects a stall once the oldest pending request has gone 10s without response headers', async () => {
    pendingFetch()
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    void countingFetch('https://abc123.api.sanity.io/v1/data/query')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS - 1)
    expect(stalls).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(stalls).toHaveBeenCalledTimes(1)
    expect(stalls.mock.calls[0][0]).toMatchObject({isBootStall: false, stallOccurrence: 1})
    expect(setStalledMock).toHaveBeenCalledWith(true)
  })

  it('does not detect a stall for a request that resolves before the trigger', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}'))
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    await countingFetch('https://abc123.api.sanity.io/v1/data/query')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS * 2)

    expect(stalls).not.toHaveBeenCalled()
  })

  it('treats a held /users/me request as a boot stall', async () => {
    pendingFetch()
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    void countingFetch('https://abc123.api.sanity.io/v1/users/me')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS)

    expect(stalls).toHaveBeenCalledTimes(1)
    expect(stalls.mock.calls[0][0]).toMatchObject({isBootStall: true})
  })

  it('identifies the oldest pending request as requests resolve out of order, including an unlabelled host', async () => {
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    const first = pendingFetch()
    const firstRequest = countingFetch('https://abc123.api.sanity.io/v1/data/query')
    await vi.advanceTimersByTimeAsync(5_000)
    first.resolve(new Response('{}'))
    await firstRequest

    pendingFetch()
    void countingFetch('https://api.sanity.io/v1/ping')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS - 1)
    expect(stalls).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(stalls).toHaveBeenCalledTimes(1)
  })

  it('clears once nothing is still pending past the trigger, and a later stall is a new occurrence', async () => {
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    const first = pendingFetch()
    const firstRequest = countingFetch('https://abc123.api.sanity.io/v1/data/query')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS)
    expect(stalls).toHaveBeenCalledTimes(1)

    first.resolve(new Response('{}'))
    await firstRequest
    expect(setStalledMock).toHaveBeenLastCalledWith(false)

    pendingFetch()
    void countingFetch('https://abc123.api.sanity.io/v1/data/query')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS)

    expect(stalls).toHaveBeenCalledTimes(2)
    expect(stalls.mock.calls[1][0]).toMatchObject({stallOccurrence: 2})
  })

  it('treats two requests stalling together as one occurrence', async () => {
    pendingFetch()
    pendingFetch()
    const countingFetch = listenerCount.resolveListenerCountingFetch()
    const stalls = vi.fn()
    listenerStall.subscribeListenerStall(stalls)

    void countingFetch('https://abc123.api.sanity.io/v1/data/query')
    void countingFetch('https://abc123.api.sanity.io/v1/data/mutate')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS)

    expect(stalls).toHaveBeenCalledTimes(1)
  })
})
