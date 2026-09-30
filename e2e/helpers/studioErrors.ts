import {
  type BrowserContext,
  type Locator,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
  type TestType,
} from '@playwright/test'

/**
 * Selector that matches any Studio error screen — both the React error
 * boundary screens (`data-testid="studio-error-screen"`) and the pre-React
 * `window.onerror` overlay (`#__sanityError`).
 */
export const STUDIO_ERROR_SELECTOR = '[data-testid="studio-error-screen"], #__sanityError'

const ERROR_SCREEN_MARKER = '__STUDIO_ERROR__'

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
 * Predicate used by {@link StudioErrorWatcher.expectError} to decide whether an observed error
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

export interface StudioErrorWatcher {
  /**
   * Expect one error matching `matcher`: it does not fail the test. Only errors matching that
   * matcher are suppressed — any other error still fails the test, so unrelated regressions
   * are not accidentally hidden. The matcher is cleared once consumed. If the expected error
   * never arrives, the caller's own assertion (e.g.
   * `expect(studioErrorLocator(page)).toBeVisible()`) is what surfaces the failure.
   */
  expectError: (matcher: StudioErrorMatcher) => void
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function attach(context: BrowserContext): Promise<StudioErrorWatcher> {
  let expected: StudioErrorMatcher | null = null

  // Throwing from an event handler fails the running test (Playwright attributes unhandled
  // errors to it), which stops a test on the first error instead of letting it time out.
  function handleError(info: StudioErrorInfo): void {
    if (expected && matches(expected, info)) {
      expected = null
      return
    }
    throw new Error(`Studio threw an unexpected ${info.source}: ${info.message}`)
  }

  context.on('weberror', (webError) => {
    const message = describeError(webError.error())
    if (message.includes('ResizeObserver')) return
    handleError({source: 'pageerror', message})
  })

  context.on('console', (msg) => {
    const type = msg.type()
    if (type !== 'warning' && type !== 'error') return
    const text = msg.text()
    if (type === 'warning') {
      if (STYLED_COMPONENTS_UNKNOWN_PROP_WARNING.test(text)) {
        handleError({source: 'styled-components-unknown-prop', message: text})
      }
      return
    }
    if (text.startsWith(ERROR_SCREEN_MARKER)) {
      handleError({source: 'error-screen', message: text.slice(ERROR_SCREEN_MARKER.length)})
      return
    }
    if (REACT_DOM_PROP_WARNING.test(text)) {
      handleError({source: 'react-dom-prop-warning', message: text})
    }
  })

  await context.addInitScript(
    ({selector, marker}) => {
      let fired = false
      new MutationObserver(() => {
        if (fired) return
        const el = document.querySelector(selector)
        if (el) {
          fired = true
          const detail =
            el.getAttribute('data-error') || el.textContent?.trim().slice(0, 200) || 'Unknown error'
          console.error(`${marker}${detail}`)
        }
      }).observe(document, {childList: true, subtree: true})
    },
    {selector: STUDIO_ERROR_SELECTOR, marker: ERROR_SCREEN_MARKER},
  )

  return {
    expectError(matcher) {
      expected = matcher
    },
  }
}

const watchers = new WeakMap<BrowserContext, Promise<StudioErrorWatcher>>()

/**
 * Attach Studio error detection to a browser context, once per context: every call for the same
 * context returns the same watcher. Every page of the context, including ones created before the
 * call, fails the running test on Studio error screens, uncaught exceptions, and DOM prop leak
 * warnings ({@link REACT_DOM_PROP_WARNING}, {@link STYLED_COMPONENTS_UNKNOWN_PROP_WARNING};
 * development build only, see their docs).
 *
 * ```ts
 * const {expectError} = await watchForStudioErrors(context)
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
 */
export function watchForStudioErrors(context: BrowserContext): Promise<StudioErrorWatcher> {
  let watcher = watchers.get(context)
  if (!watcher) {
    watcher = attach(context)
    watchers.set(context, watcher)
  }
  return watcher
}

/**
 * Run each test of a spec that uses `@playwright/test` directly under
 * {@link watchForStudioErrors}, as the `test` fixture of `studio-test.ts` does for the others.
 * Registers a `beforeEach` hook in the calling scope.
 */
export function watchEachTestForStudioErrors(
  test: TestType<
    PlaywrightTestArgs & PlaywrightTestOptions,
    PlaywrightWorkerArgs & PlaywrightWorkerOptions
  >,
): void {
  test.beforeEach(async ({context}) => {
    await watchForStudioErrors(context)
  })
}
