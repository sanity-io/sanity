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
//
// Field-actions opacity (FormFieldBaseHeader) and button hover transitions are
// a recurring source of identical-code Chromatic pairwise diffs: the floating
// "..." next to the field title and toolbar button pills land mid-fade. Kill
// transitions and keep field-actions flex fully opaque so end-of-test archives
// do not depend on hover/focus timing. Tests that open the menu still click
// `[data-testid="field-actions-trigger"]` normally.
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.dataset.chromaticDeterminism = ''
  style.textContent = `
    [contenteditable], input, textarea { caret-color: transparent !important; }
    html, body, button, input, textarea, [contenteditable] {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }
    *, *::before, *::after {
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }
    [data-actions-visible] {
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    [data-actions-visible] [data-ui='FieldActionsFlex'] {
      opacity: 1 !important;
      pointer-events: auto !important;
      width: max-content !important;
    }
    /* Block / table object menus render an ellipsis that toggles with hover
       between identical-code Chromatic captures. Keep them fully opaque. */
    [data-testid='block-preview'] button,
    [data-testid='pte-block-object'] button {
      opacity: 1 !important;
    }
    /* CommentInput applies :hover after :focus-within, so a leftover pointer
       on the card swaps the focus ring for the hover border between captures.
       Do not require [data-focused] — React focus state can lag :focus-within
       and leave the hover border winning. Force both the CSS variable and the
       computed box-shadow so styled-components hover cannot override. */
    #comment-input-root:focus-within,
    #comment-input-root:focus-within:hover {
      --input-box-shadow: inset 0 0 0 1px var(--card-focus-ring-color) !important;
      box-shadow: inset 0 0 0 1px var(--card-focus-ring-color) !important;
    }
    /* Enabled send uses tone=primary; :hover fills it solid between captures
       even after pointer park. Keep the idle primary surface. */
    [data-testid='comment-input-send-button']:not(:disabled):hover {
      background-color: var(--card-badge-primary-bg-color) !important;
      color: var(--card-badge-primary-fg-color) !important;
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
