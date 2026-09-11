// Browser test setup - runs in a real browser, so no need for
// IntersectionObserver/ResizeObserver/matchMedia mocks.

// Both @sanity/ui generations ship their static styles as stylesheets consumers import
// themselves; load them here the same way the studio entry point (`src/_exports/index.ts`)
// does. Test files run in separate iframes, so a harness that does not import the `sanity`
// entry would otherwise render `ui5` components without the v5 stylesheet — including its
// `prefers-reduced-motion` rules that `vitest.browser.config.mts` relies on.
import 'ui5/styles.css'
import '@sanity/ui/styles.css'

import {afterEach} from 'vitest'
import {cleanup} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {releaseFloatingUiSnapLock, removePointerPark} from '../browser/testHelpers'

// Keep this in sync with the `browser.viewport` default in
// vitest.browser.config.mts. Tests that call `page.viewport(...)` (e.g. toolbar
// collapse tests) mutate it for the whole iframe, so reset between tests.
const DEFAULT_VIEWPORT = {width: 1280, height: 900}

// Unmount any rendered component trees between tests. Without this, each
// test's render() stacks another tree in the DOM, so locators like
// getByTestId('field-body') resolve ambiguously (or to a stale tree) in
// later tests within the same file.
//
// With `sequence.hooks: 'list'` this runs after the Chromatic plugin's
// afterEach has archived the end state, so the pointer park element that
// `settleChromaticEndState` leaves under the real pointer is still present in
// the archive (it is transparent) and only removed here. The Floating UI
// snap observer is released here for the same reason: it must keep rounding
// offsets until the archive is taken, and must not outlive the test.
afterEach(async () => {
  await cleanup()
  removePointerPark()
  releaseFloatingUiSnapLock()
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

// Suppress noisy warnings in test output
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
