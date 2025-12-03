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
    await page
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.name$/)
      .getByTestId('string-input')
      .fill('Blue, the whale')

    await page.getByRole('button', {name: 'Close dialog'}).click()
    await expect(modal).not.toBeVisible()
  })
})

test.describe('Enhanced Object Dialog - when disabled', () => {
  test.beforeEach(async ({page, _testContext, browserName, baseURL}) => {
    // Navigate to the browser-specific no-enhanced-dialog workspace
    const workspacePath =
      browserName === 'firefox' ? 'firefox-no-enhanced-dialog' : 'chromium-no-enhanced-dialog'
    const baseUrl = new URL(baseURL || 'http://localhost:3339')
    const id = _testContext.getUniqueDocumentId()

    // Use absolute URL to navigate to the correct workspace
    await page.goto(`${baseUrl.origin}/${workspacePath}/content/input-debug;objectsDebug;${id}`)
    await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 30_000})
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: 30_000})
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

test.describe('Enhanced Object Dialog - when tab focusing on an array item', () => {
  test.beforeEach(async ({createDraftDocument, page}) => {
    // wait for form to be attached
    await createDraftDocument('/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = page.getByTestId('nested-object-dialog')

    await expect(modal).toBeVisible()
    await page
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.name$/)
      .getByTestId('string-input')
      .fill('Blue, the whale')

    await page.getByRole('button', {name: 'Close dialog'}).click()
    await expect(modal).not.toBeVisible()

    await page.getByTestId('field-animals').focus()
  })

  test(`when tab focusing on an array item, the tree editing modal should not open`, async ({
    page,
  }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
  })

  test(`When pressing enter on an array item, the tree editing modal should open`, async ({
    page,
  }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
  })
})
