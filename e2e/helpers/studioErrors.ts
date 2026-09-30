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
 * - `react-dom-prop-warning`: react-dom reported a prop leaking onto a DOM element
 * - `styled-components-unknown-prop`: styled-components reported a prop leaking onto a DOM element
 */
export type StudioErrorSource =
  | 'pageerror'
  | 'error-screen'
  | 'react-dom-prop-warning'
  | 'styled-components-unknown-prop'

/**
 * The react-dom development-build diagnostics that mean a non-DOM prop reached a DOM element
 * (or an attribute is misspelled). Only the development build of react-dom emits them, so this
 * check is live when the suite runs against `sanity dev` (the default local `webServer`) and
 * inert against a production `sanity build`, which is what CI deploys. The unit and browser-mode
 * vitest suites carry the same check in CI through
 * `@repo/test-config/vitest/failOnReactDomPropWarnings`; keep the two lists in sync.
 */
export const REACT_DOM_PROP_WARNING =
  /React does not recognize the `\S+` prop on a DOM element|Invalid DOM property `|Invalid value for prop `?\S+`? on <|for a non-boolean attribute `|for the boolean attribute `|Received NaN for the `|Unknown event handler property `|Invalid event handler property `|Invalid ARIA attribute `|Invalid aria props? |Unknown ARIA attribute `|Invalid attribute name: `|Unsupported (?:vendor-prefixed )?style property |is an invalid value for the `\S+` css style property/

/**
 * styled-components' own leak check (a `console.warn`), which also covers all-lowercase unknown
 * props such as `intent` that react-dom renders as attributes without a word. Every `@sanity/ui`
 * primitive bottoms out in a `styled.<tag>`, so this fires for props spread through them too.
 * Development build only, once per prop name per page load.
 */
export const STYLED_COMPONENTS_UNKNOWN_PROP_WARNING =
  /styled-components: it looks like an unknown prop "[^"]+" is being sent through to the DOM/

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
    const type = msg.type()
    const text = msg.text()
    if (type === 'warning') {
      if (STYLED_COMPONENTS_UNKNOWN_PROP_WARNING.test(text)) {
        handleError(state, {source: 'styled-components-unknown-prop', message: text})
      }
      return
    }
    if (type !== 'error') return
    if (text.startsWith('__STUDIO_ERROR__')) {
      handleError(state, {
        source: 'error-screen',
        message: text.slice('__STUDIO_ERROR__'.length),
      })
      return
    }
    if (REACT_DOM_PROP_WARNING.test(text)) {
      handleError(state, {source: 'react-dom-prop-warning', message: text})
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
 * in the context will auto-fail on Studio error screens, uncaught
 * exceptions, and DOM prop leak warnings ({@link REACT_DOM_PROP_WARNING},
 * {@link STYLED_COMPONENTS_UNKNOWN_PROP_WARNING}; development build only, see their docs).
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
