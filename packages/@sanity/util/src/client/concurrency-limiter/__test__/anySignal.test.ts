import {describe, expect, it, vi} from 'vitest'

import {anySignal} from '../anySignal'
import {withoutAbortSignalAny} from './withoutAbortSignalAny'

describe('anySignal', () => {
  it('uses the native AbortSignal.any when it is available', () => {
    const nativeAny = vi.spyOn(AbortSignal, 'any')
    const first = new AbortController()
    const second = new AbortController()
    const reason = new Error('cancelled')

    const combined = anySignal([first.signal, second.signal])
    second.abort(reason)

    expect(nativeAny).toHaveBeenCalledExactlyOnceWith([first.signal, second.signal])
    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe(reason)
  })

  describe('without a native AbortSignal.any', () => {
    withoutAbortSignalAny()

    it('runs against an environment without AbortSignal.any', () => {
      expect(AbortSignal.any).toBeUndefined()
    })

    it('aborts with the reason of the first signal to abort', () => {
      const first = new AbortController()
      const second = new AbortController()
      const reason = new Error('cancelled')

      const combined = anySignal([first.signal, second.signal])
      expect(combined.aborted).toBe(false)

      second.abort(reason)
      expect(combined.aborted).toBe(true)
      expect(combined.reason).toBe(reason)

      first.abort(new Error('too late'))
      expect(combined.reason).toBe(reason)
    })

    it('is already aborted when one of the signals has already aborted', () => {
      const reason = new Error('cancelled')
      const pending = new AbortController()
      const addEventListener = vi.spyOn(pending.signal, 'addEventListener')

      const combined = anySignal([pending.signal, AbortSignal.abort(reason)])

      expect(combined.aborted).toBe(true)
      expect(combined.reason).toBe(reason)
      expect(addEventListener).not.toHaveBeenCalled()
    })

    it('stops listening to the remaining signals once it has aborted', () => {
      const first = new AbortController()
      const second = new AbortController()
      const removeEventListener = vi.spyOn(second.signal, 'removeEventListener')

      anySignal([first.signal, second.signal])
      first.abort()

      expect(removeEventListener).toHaveBeenCalledExactlyOnceWith('abort', expect.any(Function))
    })

    it('does not abort the source signals', () => {
      const first = new AbortController()
      const second = new AbortController()

      anySignal([first.signal, second.signal])
      first.abort()

      expect(second.signal.aborted).toBe(false)
    })
  })
})
