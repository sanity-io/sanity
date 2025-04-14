import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test(`deprecated document type shows deprecated message`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/input-debug;deprecatedDocument')

  await page.waitForSelector(`data-testid=deprecated-document-type-banner`)

  const deprecatedBadge = await page.getByTestId(`deprecated-document-type-banner`)

  expect(deprecatedBadge).toBeVisible()
})
