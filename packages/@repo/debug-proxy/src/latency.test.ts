import {Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {withLatency} from './latency'
import {type ProxyRequest, type ProxyResponse, type ProxyTarget} from './proxy'

const req = {} as ProxyRequest
const target = {} as ProxyTarget

function fakeResponse(): ProxyResponse {
  return {destroyed: false} as ProxyResponse
}

describe('withLatency', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('holds the request for the configured delay before forwarding', () => {
    const handler = vi.fn(() => new Subscription())
    const wrapped = withLatency(handler, {minMs: 500, maxMs: 500})
    const res = fakeResponse()

    wrapped(req, res, target)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(499)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(handler).toHaveBeenCalledWith(req, res, target)
  })

  test('forwards within the jitter range', () => {
    const handler = vi.fn(() => new Subscription())
    const wrapped = withLatency(handler, {minMs: 100, maxMs: 300})

    wrapped(req, fakeResponse(), target)
    vi.advanceTimersByTime(99)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(201)
    expect(handler).toHaveBeenCalledOnce()
  })

  test('skips forwarding when the client disconnects during the delay', () => {
    const handler = vi.fn(() => new Subscription())
    const wrapped = withLatency(handler, {minMs: 500, maxMs: 500})
    const res = fakeResponse()

    wrapped(req, res, target)
    ;(res as {destroyed: boolean}).destroyed = true

    vi.advanceTimersByTime(500)
    expect(handler).not.toHaveBeenCalled()
  })

  test('unsubscribing cancels a pending forward', () => {
    const handler = vi.fn(() => new Subscription())
    const wrapped = withLatency(handler, {minMs: 500, maxMs: 500})

    const subscription = wrapped(req, fakeResponse(), target)
    subscription.unsubscribe()

    vi.advanceTimersByTime(500)
    expect(handler).not.toHaveBeenCalled()
  })
})
