import {type Locator} from '@playwright/test'

import {expect, test} from '../fixtures/copyPasteFixture'

test.describe('copy and pasting of fields', () => {
  test(`its able to copy and paste an object field successfully via keyboard shortcuts`, async ({
    page,
    createDraftDocument,
    getClipboard,
  }) => {
    let $objectWrapper: Locator

    async function navigateToNewDocumentAndGetObjectWrapper() {
      await createDraftDocument('/test/content/input-standard;objectsTest')

      await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      const $object = page.getByTestId('field-objectWithColumns').locator(`[tabindex="0"]`).first()

      await expect($object).toBeVisible()

      return $object
    }

    $objectWrapper = await navigateToNewDocumentAndGetObjectWrapper()

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()

    await page.keyboard.type('A string to copy')

    await $objectWrapper.focus()

    await expect($objectWrapper).toBeFocused()

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    await page.keyboard.press('Meta+C')

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

    // Now lets navigate to new document and paste the copied field
    $objectWrapper = await navigateToNewDocumentAndGetObjectWrapper()

    await $objectWrapper.focus()

    await expect($objectWrapper).toBeFocused()

    await $objectWrapper.press('Meta+V')

    await expect($objectWrapper).toBeVisible()
    await expect($objectWrapper).toBeFocused()

    // await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()
    await expect(page.getByText(`updated`)).toBeVisible()
  })

  test(`its able to copy and paste an object field successfully via field actions`, async ({
    page,
    createDraftDocument,
    getClipboard,
  }) => {
    let $objectWrapper: Locator

    async function navigateToNewDocumentAndGetObjectWrapper() {
      await createDraftDocument('/test/content/input-standard;objectsTest')

      await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      const $object = page.getByTestId('field-objectWithColumns').locator(`[tabindex="0"]`).first()

      await expect($object).toBeVisible()

      return $object
    }

    await navigateToNewDocumentAndGetObjectWrapper()

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()

    await page.keyboard.type('A string to copy')

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    let $fieldActions = page
      .getByTestId('field-actions-menu-objectWithColumns')
      .getByTestId('field-actions-trigger')

    //await expect($fieldActions).toBeAttached()

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Copy field'}).click()

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

    // Now lets navigate to new document and paste the copied field
    await navigateToNewDocumentAndGetObjectWrapper()

    $fieldActions = page
      .getByTestId('field-actions-menu-objectWithColumns')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()

    await expect($fieldActions).toBeVisible()

    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Paste field'}).click()

    // await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()
    await expect(page.getByText(`updated`)).toBeVisible()
    await expect(getClipboard()).toContain('A string to copy')

    await expect(page.getByTestId('field-objectWithColumns.string1').locator('input')).toHaveValue(
      'A string to copy',
    )
  })
})
