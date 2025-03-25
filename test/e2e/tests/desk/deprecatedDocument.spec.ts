import {expect} from '@playwright/test'

import {test} from '../fixtures/harFixture'

test(`deprecated document type shows deprecated message`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-debug;deprecatedDocument')

  await page.waitForSelector(`data-testid=deprecated-document-type-banner`)

  const deprecatedBadge = await page.getByTestId(`deprecated-document-type-banner`)

  expect(deprecatedBadge).toBeVisible()
})
