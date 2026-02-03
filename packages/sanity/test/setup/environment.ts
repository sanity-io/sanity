/* eslint-disable class-methods-use-this */
// oxlint-disable-next-line no-unassigned-import
import 'blob-polyfill'
// oxlint-disable-next-line no-unassigned-import
import './clipboardItemPolyfill'
// oxlint-disable-next-line no-unassigned-import
import '@testing-library/jest-dom/vitest'

import {cleanup} from '@testing-library/react'
import {afterEach, beforeEach, expect, vi} from 'vitest'

import {toMatchEmissions} from '../matchers/toMatchEmissions'

expect.extend({
  toMatchEmissions,
})

afterEach(() => cleanup())
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
class MockIntersectionObserver {
  observe(): void {
    // no-op
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
  takeRecords(): any[] {
    return []
  }
}

;(globalThis as any).IntersectionObserver = MockIntersectionObserver

// ResizeObserver isn't available in the test browser environment
class MockResizeObserver {
  observe(): void {
    // no-op
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
}
;(globalThis as any).ResizeObserver = MockResizeObserver
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
