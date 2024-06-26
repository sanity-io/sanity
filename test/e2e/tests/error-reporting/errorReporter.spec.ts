import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {SANITY_E2E_IS_AUTO_UPDATING} from '../../env'

const TELEMETRY_URL = 'https://**/intake/telemetry-status**'
const SENTRY_URL = 'https://sanity.sentry.io/**'

test('Error reporter should initialize if in an updating studio and telemetry is granted', async ({
  page,
  createDraftDocument,
}) => {
  let apiCalled = false

  await createDraftDocument('test/content/input-debug;error')
  //force telemetry to be enabled
  await page.route(TELEMETRY_URL, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'enabled',
      }),
    })
  })

  await page.getByText('Throw error').click()

  await page.route(SENTRY_URL, (route) => {
    apiCalled = true
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })

  if (SANITY_E2E_IS_AUTO_UPDATING) {
    expect(apiCalled).toBe(true)
  } else {
    expect(apiCalled).toBe(false)
  }
})
