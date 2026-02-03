import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Initial full screen', () => {
  test('if initial full screen is on for a PTE, you should be able to close it by clicking the collapse button', async ({
    page,
    browserName,
    createDraftDocument,
  }) => {
    await createDraftDocument('/content/input-standard;portable-text;initialFullScreenPTE')

    test.skip(browserName === 'firefox')
    test.slow()
    await expect(page.getByTestId('fullscreen-button-collapse')).toBeVisible()
    await page.getByTestId('fullscreen-button-collapse').click()
    await expect(
      page.getByTestId('field-text').getByTestId('fullscreen-button-expand'),
    ).toBeVisible()
  })
})
