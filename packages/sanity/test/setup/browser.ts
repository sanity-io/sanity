// Browser test setup - runs in a real browser, so no need for
// IntersectionObserver/ResizeObserver/matchMedia mocks.

// Both @sanity/ui generations ship their static styles as stylesheets consumers import
// themselves; load them here the same way the studio entry point (`src/_exports/index.ts`)
// does. Test files run in separate iframes, so a harness that does not import the `sanity`
// entry would otherwise render `ui5` components without the v5 stylesheet — including its
// `prefers-reduced-motion` rules that `vitest.browser.config.mts` relies on.
import 'ui5/styles.css'
import '@sanity/ui/styles.css'

import {afterEach, beforeEach} from 'vitest'
import {cleanup} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {parkPointer, releaseFloatingUiSnapLock, removePointerPark} from '../browser/testHelpers'

// Keep this in sync with the `browser.viewport` default in
// vitest.browser.config.mts. Tests that call `page.viewport(...)` (e.g. toolbar
// collapse tests) mutate it for the whole iframe, so reset between tests.
const DEFAULT_VIEWPORT = {width: 1280, height: 900}

// Pointer park lifecycle (the whole of it; `settleChromaticEndState` reuses
// the same element and `testHelpers.ts` documents the element itself):
//
//   beforeEach  mount the park, move the real pointer onto it
//   test        park stays mounted; a settle step hovers it again at the end
//   archive     Chromatic's afterEach captures with the park in the DOM
//   afterEach   cleanup() → release snap observer → restore the viewport →
//               parkPointer() (pointer back in the default corner) →
//               removePointerPark()
//
// Park the real pointer on the transparent park element in the bottom-right
// corner of the (default) viewport right before each test renders anything,
// and leave the park mounted (topmost, 4×4) until `afterEach`. Chromium
// dispatches `mouseover` to content that appears under a stationary pointer,
// so with the pointer over bare `body` a control rendered at that coordinate
// would start out `:hover`ed and could open its tooltip mid-test; with the
// park in place the hit test at that coordinate keeps resolving to the park.
// In a fresh page the pointer sits at Chromium's default top-left position
// (over the harness's first control) until this moves it; after a previous
// test `afterEach` has already left it in this corner, but over bare `body`,
// so the park has to be mounted again before the test renders.
beforeEach(async () => {
  await parkPointer()
})

// Unmount any rendered component trees between tests. Without this, each
// test's render() stacks another tree in the DOM, so locators like
// getByTestId('field-body') resolve ambiguously (or to a stale tree) in
// later tests within the same file.
//
// With `sequence.hooks: 'list'` this runs after the Chromatic plugin's
// afterEach has archived the end state, so the pointer park element mounted
// by `beforeEach` (and hovered again by `settleChromaticEndState`) is still
// present in the archive (it is transparent) and only removed here. The
// Floating UI snap observer is released here for the same reason: it must
// keep rounding offsets until the archive is taken, and must not outlive the
// test.
//
// Order matters for the pointer: restore the viewport first, then park the
// pointer once more on the (still mounted) park, now back in the default
// viewport's corner, and only then remove the park. A test that reduced the
// viewport (the 350×500 toolbar tests) otherwise leaves the real pointer at
// its reduced-viewport corner, and a test that ended on a click leaves it
// there — so where the pointer rests between tests would depend on the
// previous test. Nothing is mounted at this point (`cleanup()` ran), so the
// move can only hit `body` and the park.
afterEach(async () => {
  await cleanup()
  releaseFloatingUiSnapLock()
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
  await parkPointer()
  removePointerPark()
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
