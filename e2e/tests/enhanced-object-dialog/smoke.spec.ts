import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Enhanced Object Dialog - open and close', () => {
  test.beforeEach(async ({createDraftDocument}) => {
    // wait for form to be attached
    await createDraftDocument('/content/input-debug;objectsDebug')
  })

  test(`opening - when creating new array item, the tree editing modal should open`, async ({
    page,
  }) => {
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
  })

  test(`closing - when the modal is open, clicking the 'done button' will close it`, async ({
    page,
    browserName,
  }) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = page.getByTestId('nested-object-dialog')

    await expect(modal).toBeVisible()
    await page.getByRole('button', {name: 'Close dialog'}).click()

    await expect(modal).not.toBeVisible()
  })
})

test.describe('Enhanced Object Dialog - when disabled', () => {
  test.use({baseURL: 'http://localhost:3339/no-enhanced-dialog'})

  test.beforeEach(async ({createDraftDocument}) => {
    await createDraftDocument('/content/input-debug;objectsDebug')
  })

  test(`when enhancedObjectDialog is disabled, the tree editing modal should NOT open`, async ({
    page,
  }) => {
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

    await expect(page.getByTestId('edit-portal-dialog')).toBeVisible()
    // The enhanced dialog should not be visible
    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })
})
