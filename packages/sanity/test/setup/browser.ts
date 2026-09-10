// Browser test setup - runs in a real browser, so no need for
// IntersectionObserver/ResizeObserver/matchMedia mocks.

// @sanity/ui ships its static styles as a stylesheet consumers import themselves, so load it here
// the same way the studio entry point does.
import '@sanity/ui/styles.css'

import {afterEach} from 'vitest'
import {cleanup} from 'vitest-browser-react'
import {page} from 'vitest/browser'

// Keep this in sync with the `browser.viewport` default in
// vitest.browser.config.mts. Tests that call `page.viewport(...)` (e.g. toolbar
// collapse tests) mutate it for the whole iframe, so reset between tests.
const DEFAULT_VIEWPORT = {width: 1280, height: 900}

// Unmount any rendered component trees between tests. Without this, each
// test's render() stacks another tree in the DOM, so locators like
// getByTestId('field-body') resolve ambiguously (or to a stale tree) in
// later tests within the same file.
afterEach(async () => {
  await cleanup()
  await page.viewport(DEFAULT_VIEWPORT.width, DEFAULT_VIEWPORT.height)
})

// Chromatic archives `:focus` and the OS caret. Hide the caret so blink/phase
// cannot show up as a pixel diff; focus rings stay visible. Also force
// grayscale font smoothing — subpixel AA is a common source of 1px toolbar
// text diffs between identical-code captures. Applied in every browser run
// (this file has no Node `process`) so Chromatic and local chromium stay aligned.
// Do NOT hide `[data-ui="Tooltip"]` globally — PreviewTooltip and similar tests
// assert on visible tooltips; park the pointer in flaky tests instead.
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.dataset.chromaticDeterminism = ''
  style.textContent = `
    [contenteditable], input, textarea { caret-color: transparent !important; }
    html {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }
  `
  document.documentElement.appendChild(style)
}

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
