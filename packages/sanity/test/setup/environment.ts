// Skip vanilla-extract's runtime style injection in jsdom: inserting real stylesheets for every
// imported .css.ts module slows the suite down, and no jsdom test asserts on computed styles or
// vanilla-extract class names (visual behavior is covered by the vitest browser mode and
// Playwright e2e suites). See https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles
// oxlint-disable-next-line no-unassigned-import
import '@vanilla-extract/css/disableRuntimeStyles'
// oxlint-disable-next-line no-unassigned-import
import 'blob-polyfill'
// oxlint-disable-next-line no-unassigned-import
import './clipboardItemPolyfill'
// oxlint-disable-next-line no-unassigned-import
import '@testing-library/jest-dom/vitest'
// Fail any test during which react-dom reports a prop leaking onto a DOM element (see the module
// for the matched diagnostics). Installed before the console overrides below so those wrap it.
// oxlint-disable-next-line no-unassigned-import
import '@repo/test-config/vitest/failOnReactDomPropWarnings'

import {cleanup} from '@testing-library/react'
import {afterEach, beforeEach, expect, vi} from 'vitest'

import {toMatchEmissions} from '../matchers/toMatchEmissions'

expect.extend({
  toMatchEmissions,
})

afterEach(async () => {
  cleanup()
  // The default plugins' providers preload their lazy components with fire-and-forget `import()`
  // calls, and a chunk a test never rendered may still be loading when the test ends. Let those
  // imports finish before Vitest tears the environment down; otherwise it rejects them with an
  // `EnvironmentTeardownError` that counts as an unhandled error even though every test passed.
  await vi.dynamicImportSettled()
})
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

// Tests must never open a real socket. Rendering anything that subscribes to the presence store
// makes `@sanity/bifur-client` connect to the mock client's project, and it defers closing a
// socket that is still connecting until the handshake settles, so the socket outlives the test.
// When it then opens, Node's WebSocket dispatches jsdom's global `Event` on itself and throws an
// uncaught `ERR_INVALID_ARG_TYPE` that fails the run. This one stays `CONNECTING` forever.
class MockWebSocket extends EventTarget {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3
  readyState = 0
  url: string
  onopen = null
  onclose = null
  onerror = null
  onmessage = null
  constructor(url: string | URL) {
    super()
    this.url = String(url)
  }
  send(): void {
    // no-op
  }
  close(): void {
    this.readyState = this.CLOSED
  }
}
;(globalThis as any).WebSocket = MockWebSocket
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
