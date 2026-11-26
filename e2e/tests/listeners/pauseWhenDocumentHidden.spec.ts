import {expect, type Page, type Request} from '@playwright/test'

import {test} from '../../studio-test'

/** `LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY` in `sanity`, read every time the page is hidden */
const GRACE_PERIOD_STORAGE_KEY = '_sanity_listenerPauseGracePeriod'

/** Counts the listener connections the page holds open (`/data/listen/` requests in flight) */
function trackListeners(page: Page) {
  const open = new Set<Request>()
  page.on('request', (request) => {
    if (request.url().includes('/data/listen/')) open.add(request)
  })
  const close = (request: Request) => open.delete(request)
  page.on('requestfinished', close)
  page.on('requestfailed', close)
  return {count: () => open.size}
}

/**
 * Playwright cannot hide a page, so this overrides what the page reads and dispatches the event a
 * browser sends when its tab is hidden or shown
 */
function setDocumentVisibility(page: Page, visibility: DocumentVisibilityState) {
  return page.evaluate((state) => {
    Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => state})
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => state === 'hidden'})
    document.dispatchEvent(new Event('visibilitychange'))
  }, visibility)
}

test.describe('beta.releaseBackgroundListeners', () => {
  test('closes listener connections while the tab is hidden, and opens them again when shown', async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript((key) => localStorage.setItem(key, '0'), GRACE_PERIOD_STORAGE_KEY)
    const listeners = trackListeners(page)

    await page.goto(baseURL ?? '')
    await expect(page.getByTestId('structure-tool-list-pane')).toBeVisible()
    await expect.poll(() => listeners.count()).toBeGreaterThan(0)

    await setDocumentVisibility(page, 'hidden')
    await expect.poll(() => listeners.count()).toBe(0)

    await setDocumentVisibility(page, 'visible')
    await expect.poll(() => listeners.count()).toBeGreaterThan(0)
    await expect(page.getByTestId('structure-tool-list-pane')).toBeVisible()
  })
})
