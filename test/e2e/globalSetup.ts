import {chromium, type FullConfig} from '@playwright/test'

const INIT_TIMEOUT_MS = 120000
const FALLBACK_URL = 'http://localhost:3339/'

/**
 * Global setup for all end-to-end tests.
 * Because the development server can be ready to receive requests but has not
 * precompiled javascript, we want to wait here until the initial bundle is ready.
 *
 * This way, each test suite do not have the init penalty and have to deal with
 * the very different timeouts for the first and subsequent requests.
 *
 * @param config - The full Playwright configuration
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const {baseURL = FALLBACK_URL, contextOptions} = config.projects[0].use
  const browser = await chromium.launch()

  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()

  await Promise.all([
    // CI is slow to start, make sure we wait long enough
    page.waitForResponse('*/**/users/me*', {timeout: INIT_TIMEOUT_MS}),
    // This action triggers the request
    page.goto(baseURL, {timeout: INIT_TIMEOUT_MS}),
  ])

  await page.close()
  await browser.close()
}
