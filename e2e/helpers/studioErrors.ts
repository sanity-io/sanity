import {type BrowserContext, type Locator, type Page} from '@playwright/test'

/**
 * Selector that matches any Studio error screen — both the React error
 * boundary screens (`data-testid="studio-error-screen"`) and the pre-React
 * `window.onerror` overlay (`#__sanityError`).
 */
export const STUDIO_ERROR_SELECTOR = '[data-testid="studio-error-screen"], #__sanityError'

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

function attachErrorDetection(page: Page, state: {expecting: boolean}): void {
  page.on('pageerror', (error) => {
    if (state.expecting) return
    if (error.message.includes('ResizeObserver')) return
    throw new Error(`Studio threw an uncaught exception: ${error.message}`)
  })

  page.on('console', (msg) => {
    if (state.expecting) return
    if (msg.type() === 'error' && msg.text().startsWith('__STUDIO_ERROR__')) {
      throw new Error(msg.text().slice('__STUDIO_ERROR__'.length))
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
        console.error(`__STUDIO_ERROR__Studio error screen detected: ${detail}`)
      }
    }).observe(document, {childList: true, subtree: true})
  }, STUDIO_ERROR_SELECTOR)
}

/**
 * Attach Studio error detection to a browser context. Every page created
 * in the context will auto-fail on Studio error screens.
 *
 * Returns a handle to opt out when asserting errors:
 * ```ts
 * const {expectError} = watchForStudioErrors(context)
 * // later…
 * expectError()
 * await expect(studioErrorLocator(page)).toBeVisible()
 * ```
 */
export function watchForStudioErrors(context: BrowserContext) {
  const state = {expecting: false}
  context.on('page', (page) => {
    attachErrorDetection(page, state)
  })
  return {
    expectError() {
      state.expecting = true
    },
  }
}
