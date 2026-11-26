import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import type * as ListenerStallExports from './listenerStall'

const setStalledMock = vi.fn()

vi.mock('./studioTabs', () => ({setStalled: setStalledMock}))

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
  let listenerCount: typeof ListenerCountExports
  let listenerStall: typeof ListenerStallExports
  let countingFetch: ReturnType<typeof ListenerCountExports.resolveListenerCountingFetch>
  const stalls = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    setStalledMock.mockClear()
    stalls.mockClear()
    vi.stubGlobal('fetch', vi.fn())
    listenerCount = await import('./listenerCount')
    listenerStall = await import('./listenerStall')
    countingFetch = listenerCount.resolveListenerCountingFetch()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('detects one stall once requests have gone 10s without response headers', async () => {
    pendingFetch()
    pendingFetch()
    listenerStall.subscribeListenerStall(stalls)

    void countingFetch('https://abc123.api.sanity.io/v1/data/query')
    void countingFetch('https://abc123.api.sanity.io/v1/data/mutate')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS - 1)
    expect(stalls).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(stalls).toHaveBeenCalledTimes(1)
    expect(stalls.mock.calls[0][0]).toMatchObject({isBootStall: false, stallOccurrence: 1})
    expect(setStalledMock).toHaveBeenCalledWith(true)
  })

  it('times the trigger from the oldest request still pending', async () => {
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

  it('replays an active boot stall to the first subscriber added after it was detected, once only', async () => {
    pendingFetch()

    void countingFetch('https://abc123.api.sanity.io/v1/users/me')
    await vi.advanceTimersByTimeAsync(listenerStall.LISTENER_STALL_TRIGGER_MS)

    listenerStall.subscribeListenerStall(stalls)
    expect(stalls).toHaveBeenCalledTimes(1)
    expect(stalls.mock.calls[0][0]).toMatchObject({isBootStall: true, stallOccurrence: 1})

    const anotherLateSubscriber = vi.fn()
    listenerStall.subscribeListenerStall(anotherLateSubscriber)
    expect(anotherLateSubscriber).not.toHaveBeenCalled()
  })
})
