// eslint-disable-next-line import/no-unassigned-import, import/no-extraneous-dependencies
import 'blob-polyfill'
// eslint-disable-next-line import/no-unassigned-import, import/no-extraneous-dependencies
import './clipboardItemPolyfill'
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/vitest'

import {cleanup} from '@testing-library/react'
import {afterEach, beforeEach, expect, vi} from 'vitest'

import {toMatchEmissions} from '../matchers/toMatchEmissions'

expect.extend({
  toMatchEmissions,
})

afterEach(() => cleanup())

export {}
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// get rid of context warning
const warn = console.warn
const error = console.error
;(globalThis as any).console = {
  ...(globalThis as any).console,
  warn: (...args: any[]) => {
    if (!/No context provided/.test(args[0])) {
      warn(...args)
    }
  },
  error: (...args: any[]) => {
    if (!/flushSync/.test(args[0])) {
      error(...args)
    }
  },
}

// IntersectionObserver isn't available in the test browser environment
const mockIntersectionObserver = vi.fn().mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})

;(globalThis as any).IntersectionObserver = mockIntersectionObserver as any

// ResizeObserver isn't available in the test browser environment
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
;(globalThis as any).ResizeObserver = mockResizeObserver as any
;(globalThis as any).matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
;(globalThis as any).Promise.withResolvers = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {}
  let reject: (reason?: any) => void = () => {}

  const promise: Promise<T> = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  return {promise, resolve, reject}
}

// Resets the matchMedia mock
beforeEach(() => {
  ;(globalThis as any).matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})
