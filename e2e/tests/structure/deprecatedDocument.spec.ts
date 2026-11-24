import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test(`deprecated document type shows deprecated message`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/content/input-debug;deprecatedDocument')

  await expect(page.getByTestId('deprecated-document-type-banner')).toBeVisible()
})
