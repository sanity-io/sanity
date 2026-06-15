import {type BrowserContext, type Locator, type Page} from '@playwright/test'

/**
 * Selector that matches any Studio error screen — both the React error
 * boundary screens (`data-testid="studio-error-screen"`) and the pre-React
 * `window.onerror` overlay (`#__sanityError`).
 */
export const STUDIO_ERROR_SELECTOR = '[data-testid="studio-error-screen"], #__sanityError'

/**
 * Source of a detected studio error.
 * - `pageerror`: an uncaught exception propagated to `window.onerror`
 * - `error-screen`: a rendered studio error screen (React boundary or pre-React overlay)
 */
export type StudioErrorSource = 'pageerror' | 'error-screen'

export interface StudioErrorInfo {
  source: StudioErrorSource
  message: string
}

/**
 * Predicate used by {@link expectError} to decide whether an observed error
 * is the one the caller expected. Strings and regexps are matched against
 * `message`; functions receive the full {@link StudioErrorInfo}.
 */
export type StudioErrorMatcher = string | RegExp | ((info: StudioErrorInfo) => boolean)

function matches(matcher: StudioErrorMatcher, info: StudioErrorInfo): boolean {
  if (typeof matcher === 'string') return info.message.includes(matcher)
  if (matcher instanceof RegExp) return matcher.test(info.message)
  return matcher(info)
}

/**
 * Returns a Playwright locator for the Studio error screen.
 * ```ts
 * await expect(studioErrorLocator(page)).toBeVisible()
 * await expect(studioErrorLocator(page)).toHaveAttribute('data-error', /Session not found/)
 * ```
 */
export function studioErrorLocator(page: Page): Locator {
  return page.locator(STUDIO_ERROR_SELECTOR)
}

interface WatcherState {
  expected: StudioErrorMatcher | null
}

function handleError(state: WatcherState, info: StudioErrorInfo): void {
  if (state.expected && matches(state.expected, info)) {
    state.expected = null
    return
  }
  throw new Error(`Studio threw an unexpected ${info.source}: ${info.message}`)
}

function attachErrorDetection(page: Page, state: WatcherState): void {
  page.on('pageerror', (error) => {
    if (error.message.includes('ResizeObserver')) return
    handleError(state, {source: 'pageerror', message: error.message})
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().startsWith('__STUDIO_ERROR__')) {
      handleError(state, {
        source: 'error-screen',
        message: msg.text().slice('__STUDIO_ERROR__'.length),
      })
    }
  })

  void page.addInitScript((selector) => {
    let fired = false
    new MutationObserver(() => {
      if (fired) return
      const el = document.querySelector(selector)
      if (el) {
        fired = true
        const detail =
          el.getAttribute('data-error') || el.textContent?.trim().slice(0, 200) || 'Unknown error'
        console.error(`__STUDIO_ERROR__${detail}`)
      }
    }).observe(document, {childList: true, subtree: true})
  }, STUDIO_ERROR_SELECTOR)
}

/**
 * Attach Studio error detection to a browser context. Every page created
 * in the context will auto-fail on Studio error screens and uncaught
 * exceptions.
 *
 * To assert that a specific error is expected, pass a matcher to
 * `expectError`. Only errors matching that matcher are suppressed — any
 * other error still fails the test, so unrelated regressions are not
 * accidentally hidden.
 *
 * ```ts
 * const {expectError} = watchForStudioErrors(context)
 * expectError(/Session not found/)
 * await expect(studioErrorLocator(page)).toBeVisible()
 * ```
 *
 * The matcher may be a substring, a regexp, or a predicate receiving
 * `{source, message}`:
 *
 * ```ts
 * expectError(({source, message}) => source === 'error-screen' && message.includes('CORS'))
 * ```
 *
 * Each call expects a single matching error; the matcher is cleared once
 * consumed. If the expected error never arrives, the caller's own
 * assertion (e.g. `expect(studioErrorLocator(page)).toBeVisible()`) is
 * what surfaces the failure.
 */
export function watchForStudioErrors(context: BrowserContext): {
  expectError: (matcher: StudioErrorMatcher) => void
} {
  const state: WatcherState = {expected: null}
  context.on('page', (page) => {
    attachErrorDetection(page, state)
  })
  return {
    expectError(matcher) {
      state.expected = matcher
    },
  }
}
