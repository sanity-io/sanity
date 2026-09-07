import {getEventListeners} from 'node:events'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {anySignal} from '../anySignal'

const nativeAnyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any')

describe('anySignal', () => {
  afterEach(() => {
    if (nativeAnyDescriptor) {
      Object.defineProperty(AbortSignal, 'any', nativeAnyDescriptor)
    } else {
      Reflect.deleteProperty(AbortSignal, 'any')
    }
  })

  it('delegates to the native static when it exists', () => {
    const spy = vi.spyOn(AbortSignal, 'any')
    const a = new AbortController()
    const b = new AbortController()

    const combined = anySignal([a.signal, b.signal])

    expect(spy).toHaveBeenCalledWith([a.signal, b.signal])
    expect(combined).toBe(spy.mock.results[0].value)
  })

  describe('without the native static (Safari 17.0 – 17.3)', () => {
    beforeEach(() => {
      Object.defineProperty(AbortSignal, 'any', {
        value: undefined,
        configurable: true,
        writable: true,
      })
    })

    it('aborts with the reason of whichever source aborts first', () => {
      const a = new AbortController()
      const b = new AbortController()
      const reason = new Error('b aborted')

      const combined = anySignal([a.signal, b.signal])
      expect(combined.aborted).toBe(false)

      b.abort(reason)
      a.abort(new Error('too late'))

      expect(combined.aborted).toBe(true)
      expect(combined.reason).toBe(reason)
    })

    it('is already aborted when a source is already aborted', () => {
      const a = new AbortController()
      const b = new AbortController()
      const reason = new Error('already aborted')
      b.abort(reason)

      const combined = anySignal([a.signal, b.signal])

      expect(combined.aborted).toBe(true)
      expect(combined.reason).toBe(reason)
      expect(getEventListeners(a.signal, 'abort')).toHaveLength(0)
    })

    it('removes its listeners from every source once one of them aborts', () => {
      const a = new AbortController()
      const b = new AbortController()
      const c = new AbortController()

      anySignal([a.signal, b.signal, c.signal])
      expect(getEventListeners(a.signal, 'abort')).toHaveLength(1)
      expect(getEventListeners(c.signal, 'abort')).toHaveLength(1)

      b.abort()

      expect(getEventListeners(a.signal, 'abort')).toHaveLength(0)
      expect(getEventListeners(b.signal, 'abort')).toHaveLength(0)
      expect(getEventListeners(c.signal, 'abort')).toHaveLength(0)
    })

    it('does not abort the sources when the combined signal is not aborted', () => {
      const a = new AbortController()
      const b = new AbortController()

      const combined = anySignal([a.signal, b.signal])
      b.abort()

      expect(combined.aborted).toBe(true)
      expect(a.signal.aborted).toBe(false)
    })
  })
})
