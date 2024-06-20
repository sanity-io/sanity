import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {SANITY_E2E_IS_AUTO_UPDATING} from '../../env'

const SENTRY_URL = 'https://sentry.sanity.io/**'

test('Sentry session should begin if in an updating studio', async ({page, baseURL}) => {
  let apiCalled = false

  /*
   * Network conditions in CI can be slow.
   * Since we're just checking if sentryErrorReporter has been initialized,
   * we can just mock the response, rather than wait for it.
   */
  await page.route(SENTRY_URL, (route) => {
    apiCalled = true
    route.fulfill({status: 200, body: 'OK'})
  })

  // Go to the page
  await page.goto(baseURL ?? '')

  // Wait for a bit to see if the studio calls the Sentry URL
  await page.waitForTimeout(20_000)

  // Check the condition and assert
  if (SANITY_E2E_IS_AUTO_UPDATING) {
    expect(apiCalled).toBe(true)
  } else {
    expect(apiCalled).toBe(false)
  }
})
