import {expect, test} from '../fixtures/copyPasteFixture'

test.describe('copy and pasting of fields', () => {
  //   test.use({
  //     permissions: ['clipboard-read', 'clipboard-write'],
  //   })
  //   test.beforeEach(async ({context}) => {
  //     await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  //   })
  test(`its able to copy and paste an object field successfully via keyboard shortcuts`, async ({
    browserName,
    page,
    createDraftDocument,
    getClipboardItemsAsText,
  }) => {
    await createDraftDocument('/test/content/input-standard;objectsTest')

    await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

    const $objectWrapper = page
      .getByTestId('field-objectWithColumns')
      .locator(`[tabindex="0"]`)
      .first()

    await expect($objectWrapper).toBeVisible()

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()

    await page.keyboard.fill('A string to copy')

    await $objectWrapper.focus()

    await expect($objectWrapper).toBeFocused()

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    await page.keyboard.press('Meta+C')

    // Firefox does not support the clipboard API yet
    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

    await expect(await getClipboardItemsAsText()).toContain('A string to copy')

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()
    await page.keyboard.press('Meta+A')
    await page.keyboard.press('Delete')

    await $objectWrapper.focus()

    await expect($objectWrapper).toBeFocused()

    await $objectWrapper.press('Meta+V')

    await expect($objectWrapper).toBeVisible()
    await expect($objectWrapper).toBeFocused()

    await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()
  })

  test(`its able to copy and paste an object field successfully via field actions`, async ({
    browserName,
    page,
    createDraftDocument,
    getClipboardItemsAsText,
    getClipboardItemByMimeTypeAsText,
  }) => {
    await createDraftDocument('/test/content/input-standard;objectsTest')

    await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

    const $object = page.getByTestId('field-objectWithColumns').locator(`[tabindex="0"]`).first()

    await expect($object).toBeVisible()

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()

    await page.keyboard.fill('A string to copy')

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    let $fieldActions = page
      .getByTestId('field-actions-menu-objectWithColumns')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Copy field'}).click()

    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

    // Check that the plain text version is set
    await expect(await getClipboardItemsAsText()).toContain('A string to copy')

    // Test the exact mimetype
    await expect(await getClipboardItemByMimeTypeAsText('web application/sanity-studio')).toContain(
      'A string to copy',
    )

    await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()
    await page.keyboard.press('Meta+A')
    await page.keyboard.press('Delete')

    $fieldActions = page
      .getByTestId('field-actions-menu-objectWithColumns')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()

    await expect($fieldActions).toBeVisible()

    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Paste field'}).click()

    await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()

    await expect(page.getByTestId('field-objectWithColumns.string1').locator('input')).toHaveValue(
      'A string to copy',
    )
  })
})
