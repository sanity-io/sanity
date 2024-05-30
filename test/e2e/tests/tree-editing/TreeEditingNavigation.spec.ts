import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {waitForOpacityChange} from '../utils/waitForOpacityChange'

test.describe('basic - open and close', () => {
  test(`opening - when creating new array item, the tree editing modal should open`, async ({
    page,
    createDraftDocument,
  }) => {
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

    const modal = await page.getByTestId('tree-editing-dialog')
    await expect(modal).toBeVisible()
  })

  test(`closing - when the modal is open, clicking the 'done button' will close it`, async ({
    page,
    createDraftDocument,
  }) => {
    await createDraftDocument('/test/content/input-debug;objectsDebug')

    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()
  })
})

test(`actions - blocked main document action when modal is open`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;objectsDebug')

  await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})

test(`actions - main document action when modal is closed will be enabled`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;objectsDebug')

  await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
  await page.getByTestId('tree-editing-done').click()

  await expect(page.getByTestId('action-Publish')).not.toBeDisabled()
})

test.describe('navigation - tree sidebar', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    modal.getByTestId('string-input').fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    // second element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    modal.getByTestId('string-input').fill('Lucy, the cat')
    await page.getByRole('button', {name: 'Done'}).click()
  })

  // first level array item test
  test(`opening the first item, you should be able to navigate to the second array item`, async ({
    page,
  }) => {
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Albert, the whale'}).click()
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // click on second array item
    await modal.getByRole('button', {name: 'Lucy, the cat'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    //await page.waitForTimeout(500) // Hack, need to wait for animation to finish

    // make sure that item is selected on nav tree
    await expect(
      await page.getByRole('treeitem', {name: 'Lucy, the cat'}).getByTestId('side-menu-item'),
    ).toHaveAttribute('data-selected')

    // make sure first input has the right data
    await expect(await modal.getByTestId('string-input').inputValue()).toBe('Lucy, the cat')

    // make sure breadcrumb shows the right item
    await expect(await modal.locator('#tree-breadcrumb-menu-button').textContent()).toBe(
      'Lucy, the cat',
    )
  })
})
