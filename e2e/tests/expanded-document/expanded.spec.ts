import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('maximized document', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    test.slow()
    await createDraftDocument('/content/input-standard;referenceTest')

    await expect(page.getByTestId('focus-pane-button-focus')).toBeVisible()
    await expect(page.getByTestId('field-title').getByTestId('string-input')).toBeVisible()

    await page.getByTestId('field-title').getByTestId('string-input').fill('Test Author')
  })

  test(`focus pane button shows the pane breadcrumb`, async ({page}) => {
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Author'),
    ).toBeVisible()
  })

  test(`focus pane button collapses the pane breadcrumb when the focus pane button is clicked again`, async ({
    page,
  }) => {
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Author'),
    ).toBeVisible()

    await page.getByTestId('focus-pane-button-collapse').click()

    await expect(page.getByTestId('document-header-breadcrumb')).not.toBeVisible()
  })

  test('navigation to referenced document works when document is maximized', async ({page}) => {
    test.slow()

    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.locator('#selfOrEmpty-selectTypeMenuButton')).toBeVisible()
    await page.locator('#selfOrEmpty-selectTypeMenuButton').click()
    await expect(
      page.getByTestId('create-new-document-select-reference-test-selectTypeMenuItem'),
    ).toBeVisible()
    await page.getByTestId('create-new-document-select-reference-test-selectTypeMenuItem').click()

    await expect(page.getByTestId('field-title').getByTestId('string-input')).toBeVisible()
    await expect(page.getByTestId('field-title').getByTestId('string-input')).toBeEnabled()

    await page.getByTestId('field-title').getByTestId('string-input').fill('Test Name')

    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Author'),
    ).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Name'),
    ).toBeVisible()
  })

  test('focus pane hides previous and after panes in the breadcrumb', async ({page}) => {
    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(4)
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()

    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(1)
  })

  test('pane focuses on the middle pane, will close references to the right', async ({page}) => {
    test.slow()

    // set first reference
    await expect(page.locator('#selfOrEmpty-selectTypeMenuButton')).toBeVisible()
    await page.locator('#selfOrEmpty-selectTypeMenuButton').click()
    await expect(
      page.getByTestId('create-new-document-select-reference-test-selectTypeMenuItem'),
    ).toBeVisible()
    await page.getByTestId('create-new-document-select-reference-test-selectTypeMenuItem').click()

    await expect(page.getByTestId('document-panel-document-title').nth(1)).toBeVisible()

    await expect(page.getByTestId('field-title').getByTestId('string-input').nth(1)).toBeVisible()

    await page.getByTestId('field-title').getByTestId('string-input').nth(1).fill('Test Name')

    // Reopen the first document pane
    await page.getByTestId('pane-header').nth(3).click()

    await expect(page.getByTestId('document-panel-document-title').nth(0)).toBeVisible()
    await expect(page.getByTestId('document-panel-document-title').nth(0)).toContainText(
      'Test Author',
    )

    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(6)
    await expect(page.getByTestId('focus-pane-button-focus')).toBeVisible()
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(1)
    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()
    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Author'),
    ).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Test Name'),
    ).not.toBeVisible()
  })

  test('navigating to a non-document pane shows the right panes', async ({page}) => {
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(1)
    await expect(page.getByTestId('document-header-breadcrumb')).toBeVisible()

    await expect(page.getByRole('button', {name: 'Reference test'})).toBeVisible()
    await page.getByRole('button', {name: 'Reference test'}).click()

    await expect(page.locator('[data-testid="pane-header"]')).toHaveCount(3)
  })
})

test.describe('maximized document - with enhanced object dialog', () => {
  test.beforeEach(async ({createDraftDocument}) => {
    await createDraftDocument('/content/input-debug;objectsDebug')
  })

  test('when the enhanced object dialog is open, the maximized document should be the one that is open', async ({
    page,
  }) => {
    await page.getByTestId('focus-pane-button-focus').click()

    await expect(page.getByTestId('field-title').getByTestId('string-input')).toBeVisible()
    await page.getByTestId('field-title').getByTestId('string-input').fill('Object')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = page.getByTestId('nested-object-dialog')

    await expect(modal).toBeVisible()

    await expect(page.getByTestId('add-multiple-object-button').nth(1)).toBeVisible()
    await page.getByTestId('add-multiple-object-button').nth(1).click()

    await expect(page.getByRole('menuitem', {name: 'Species'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Species'}).click()

    await expect(page.locator('[data-testid^="create-new-document-select-"]')).toBeVisible()
    await page.locator('[data-testid^="create-new-document-select-"]').click()

    await expect(page.getByTestId('document-panel-document-title')).toBeVisible()

    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()
    await page.getByTestId('field-name').getByTestId('string-input').fill('Species')

    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Object').nth(1),
    ).toBeVisible()
    await expect(
      page.getByTestId('document-header-breadcrumb').getByText('Species'),
    ).not.toBeVisible()
  })
})
