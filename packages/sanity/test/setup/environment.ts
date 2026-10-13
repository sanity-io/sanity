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

// jsdom exposes Node's (undici's) WebSocket as the global, so unit tests that
// mount a workspace let `@sanity/bifur-client` open a REAL socket to
// `wss://<projectId>.api.sanity.io/v1/socket/…` — the wildcard DNS resolves
// even for mock project ids. When that handshake completes before the test
// file tears down, undici fires its `open` event using the jsdom-realm `Event`
// on a Node-realm event target, which throws `ERR_INVALID_ARG_TYPE`
// ("The 'event' argument must be an instance of Event. Received an instance
// of Event") and fails the whole run as an unhandled error — a race that CI
// loses only sometimes. Unit tests must not talk to the network anyway, so
// the global is an inert stand-in that never connects. Tests that assert on
// socket semantics install their own fake (see bifurClientConnection.test.ts).
class MockWebSocket extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3
  readonly url: string
  readonly protocol = ''
  readonly extensions = ''
  readonly bufferedAmount = 0
  binaryType: 'blob' | 'arraybuffer' = 'blob'
  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  constructor(url: string | URL, _protocols?: string | string[]) {
    super()
    this.url = String(url)
  }
  send(): void {
    // no-op — never connected
  }
  close(): void {
    this.readyState = MockWebSocket.CLOSED
  }
}

;(globalThis as any).WebSocket = MockWebSocket

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
