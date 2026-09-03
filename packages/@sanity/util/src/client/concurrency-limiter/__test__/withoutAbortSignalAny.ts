import {afterEach, beforeEach} from 'vitest'

/**
 * Removes `AbortSignal.any` for the duration of each test in the enclosing `describe`, the way
 * Safari 17.3 and older browsers behave, and restores the native implementation afterwards.
 */
export function withoutAbortSignalAny(): void {
  const native = Object.getOwnPropertyDescriptor(AbortSignal, 'any')

  beforeEach(() => {
    Object.defineProperty(AbortSignal, 'any', {
      configurable: true,
      writable: true,
      value: undefined,
    })
  })

  afterEach(() => {
    if (native) {
      Object.defineProperty(AbortSignal, 'any', native)
    } else {
      Reflect.deleteProperty(AbortSignal, 'any')
    }
  })
}
