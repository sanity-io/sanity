import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('basic - open and close', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // wait for form to be attached
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.waitForSelector('[data-testid="document-panel-scroller"]', {
      state: 'attached',
      timeout: 40000,
    })
  })

  test(`opening - when creating new array item, the tree editing modal should open`, async ({
    page,
  }) => {
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

    const modal = await page.getByTestId('tree-editing-dialog')
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})
    await expect(modal).toBeVisible()
  })

  test(`closing - when the modal is open, clicking the 'done button' will close it`, async ({
    page,
    browserName,
  }) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})
    await page.getByRole('button', {name: 'Done'}).click()

    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'detached'})

    await expect(modal).not.toBeVisible()
  })
})

test.describe('basic - main document action', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // wait for form to be attached
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.waitForSelector('[data-testid="document-panel-scroller"]', {
      state: 'attached',
      timeout: 40000,
    })

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})
  })

  test(`actions - blocked main document action when modal is open`, async ({page}) => {
    await expect(page.getByTestId('action-Publish')).toBeDisabled()
  })

  test(`actions - main document action when modal is closed will be enabled`, async ({
    page,
    browserName,
  }) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await page.getByTestId('tree-editing-done').click()

    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'detached'})
    await expect(page.getByTestId('action-Publish')).not.toBeDisabled()
  })
})
