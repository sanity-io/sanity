import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`deprecated document type shows deprecated message`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-debug;deprecatedDocument')

  const deprecatedBannerTestId = 'deprecated-document-type-banner'
  await page.waitForSelector(`[data-testid="${deprecatedBannerTestId}"]`)

  expect(page.getByTestId(deprecatedBannerTestId)).toBeVisible()
})
