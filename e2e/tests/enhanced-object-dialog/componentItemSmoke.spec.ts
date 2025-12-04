import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Enhanced Object Dialog - schema with component item and input smoke test', () => {
  test.beforeEach(async ({createDraftDocument}) => {
    // wait for form to be attached
    await createDraftDocument('/content/input-debug;objectsDebug')
  })

  test(`opening - when creating new item with custom components.item, the modal should open`, async ({
    page,
  }) => {
    const button = page
      .getByTestId('field-arrayofObjectsWithItem')
      .getByTestId('add-single-object-button')
    await expect(button).toBeEnabled()
    await button.click()

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
  })

  test(`opening - when clicking the internationalized array string field, the modal should not open`, async ({
    page,
  }) => {
    const input = page.getByTestId('field-greeting[_key=="en"].value').getByTestId('string-input')
    await expect(input).toBeEnabled()
    await input.click()
    await input.fill('Test')

    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })
})
