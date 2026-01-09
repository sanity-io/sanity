import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Enhanced Object Dialog - schema with component item and input smoke test', () => {
  test.beforeEach(async ({createDraftDocument}) => {
    // wait for form to be attached
    await createDraftDocument('/content/input-debug;objectsDebug')
    test.slow()
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
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    await input.fill('Test')
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })

  test(`opening - when clicking the internationalized array string field, and click the next one, the modal should not open`, async ({
    page,
  }) => {
    const input = page.getByTestId('field-greeting[_key=="en"].value').getByTestId('string-input')
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
    await input.click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
    await input.fill('Test')

    await page.getByRole('button', {name: 'FR'}).click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    const inputFr = page.getByTestId('field-greeting[_key=="fr"].value').getByTestId('string-input')
    await expect(inputFr).toBeVisible()
    await expect(inputFr).toBeEnabled()
    await inputFr.click()
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    await inputFr.fill('Test but in french')
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })

  test(`opening - when clicking a component?.field and component?.input it will open the dialog`, async ({
    page,
  }) => {
    const field = page
      .getByTestId('field-arrayWithNoTitle_2')
      .getByTestId('add-single-object-button')
    await expect(field).toBeEnabled()
    await field.click()

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
  })

  test('should not open - when clicking an string input with the inline changes, it should not open the dialog', async ({
    page,
  }) => {
    // as string inputs become pte

    await expect(page.getByTestId('pane-context-menu-button')).toBeVisible()
    await page.getByTestId('pane-context-menu-button').click()
    await expect(page.getByTestId('action-inlinechanges')).toBeVisible()
    await page.getByTestId('action-inlinechanges').click()

    await page.getByTestId('field-title').getByTestId('string-input-portable-text').click()
    await page.getByTestId('field-title').getByTestId('string-input-portable-text').fill('Test')
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })
})
