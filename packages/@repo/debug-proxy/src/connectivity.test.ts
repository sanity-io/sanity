import {EventEmitter} from 'node:events'

import {Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createConnectionFlapper} from './connectivity'
import {type ProxyRequest, type ProxyResponse, type ProxyTarget} from './proxy'

function fakeResponse() {
  const emitter = new EventEmitter() as EventEmitter & {destroyed: boolean; destroy: () => void}
  emitter.destroyed = false
  emitter.destroy = () => {
    emitter.destroyed = true
    emitter.emit('close')
  }
  return emitter as unknown as ProxyResponse & {destroyed: boolean}
}

const req = {} as ProxyRequest
const target = {} as ProxyTarget

describe('createConnectionFlapper', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('delegates to the handler while online', () => {
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 1000})
    const handler = vi.fn(() => new Subscription())
    const res = fakeResponse()

    flapper.wrap(handler)(req, res, target)

    expect(flapper.isOnline()).toBe(true)
    expect(handler).toHaveBeenCalledWith(req, res, target)
    expect(res.destroyed).toBe(false)
    flapper.stop()
  })

  test('resets new requests while offline and recovers when back online', () => {
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 500})
    const handler = vi.fn(() => new Subscription())
    const wrapped = flapper.wrap(handler)

    vi.advanceTimersByTime(1000)
    expect(flapper.isOnline()).toBe(false)

    const offlineRes = fakeResponse()
    wrapped(req, offlineRes, target)
    expect(offlineRes.destroyed).toBe(true)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(flapper.isOnline()).toBe(true)

    const onlineRes = fakeResponse()
    wrapped(req, onlineRes, target)
    expect(handler).toHaveBeenCalledOnce()
    expect(onlineRes.destroyed).toBe(false)
    flapper.stop()
  })

  test('tears down in-flight responses on the transition to offline', () => {
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 1000})
    const wrapped = flapper.wrap(() => new Subscription())
    const streaming = fakeResponse()
    wrapped(req, streaming, target)

    vi.advanceTimersByTime(1000)
    expect(streaming.destroyed).toBe(true)
    flapper.stop()
  })

  test('does not tear down responses that completed before going offline', () => {
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 1000})
    const wrapped = flapper.wrap(() => new Subscription())
    const res = fakeResponse()
    wrapped(req, res, target)
    res.emit('close')

    const destroy = vi.spyOn(res, 'destroy')
    vi.advanceTimersByTime(1000)
    expect(destroy).not.toHaveBeenCalled()
    flapper.stop()
  })

  test('reports every transition and keeps cycling', () => {
    const onTransition = vi.fn()
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 500, onTransition})

    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(500)
    vi.advanceTimersByTime(1000)
    expect(onTransition.mock.calls).toEqual([[false], [true], [false]])
    flapper.stop()
  })

  test('stop() freezes the current state', () => {
    const flapper = createConnectionFlapper({onlineMs: 1000, offlineMs: 1000})
    flapper.stop()
    vi.advanceTimersByTime(10_000)
    expect(flapper.isOnline()).toBe(true)
  })
})
