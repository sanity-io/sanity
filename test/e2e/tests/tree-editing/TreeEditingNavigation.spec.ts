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
    await modal.getByTestId('string-input').fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    await expect(modal).not.toBeVisible()

    // second element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await modal.getByTestId('string-input').fill('Lucy, the cat')
    await page.getByRole('button', {name: 'Done'}).click()

    /* structure:
    {
      Albert, the whale
      Lucy, the cat
    } */
  })

  // first level array item test
  test(`opening the first item, you should be able to navigate to the second array item`, async ({
    page,
  }) => {
    /* travelling from Albert, the Whale -> Lucy, the cat (sister item) via sidebar */
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Albert, the whale'}).click()
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // click on second array item
    await modal.getByRole('button', {name: 'Lucy, the cat'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

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

test.describe('navigation - breadcrumb', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await modal.getByTestId('string-input').fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    await expect(modal).not.toBeVisible()

    // second element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await modal.getByTestId('string-input').fill('Lucy, the cat')
    await page.getByRole('button', {name: 'Done'}).click()

    /* structure:
    {
      Albert, the whale
      Lucy, the cat
    } */
  })

  // first level array item test
  test(`opening the first item, you should be able to navigate to the second array item`, async ({
    page,
  }) => {
    /* travelling from Albert, the Whale -> Lucy, the cat (sister item) via breadcrumb */

    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // click the breacrumb
    await page.locator('#tree-breadcrumb-menu-button').click()
    await page.waitForSelector('[data-ui="Popover__wrapper"]', {state: 'attached'})

    // navigate on second array item in breadcrumb
    // for some reason when trying to click playwright doesn't like the dropdown menu and doesn't let me select any
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

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

test.describe('navigation - form', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await modal.getByTestId('string-input').fill('Albert, the whale')

    // add first child item
    await modal.getByTestId('add-single-object-button').click()

    const selector = [
      '[data-testid^="field-animals[_key="]', // Match the beginning part
      '[data-testid*="].friends[_key="]', // Ensure it contains the middle part
      '[data-testid$="].name"]', // Match the ending part
    ].join('')

    await page.locator(selector).getByTestId('string-input').fill('Eliza, the friendly dolphin')

    //open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // return to parent item
    await page.getByRole('list').getByRole('button', {name: 'Albert, the whale'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // add new child item
    await modal.getByTestId('add-single-object-button').click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    await page.locator(selector).getByTestId('string-input').fill('Doris, the friendly fish')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()

    /* structure:
    {
      Albert, the whale
        - Eliza, the friendly dolphin
        - Doris, the friendly fish
    } */
  })

  test(`opening the first item, when you have an array with two objects in an object you should be able to navigate on the form side`, async ({
    page,
  }) => {
    /* travelling from Albert, the Whale (parent) -> Eliza, the friendly dolphin (first item) via form */
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    await modal.getByRole('button', {name: 'Eliza, the friendly dolphin'}).click()

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // make sure that item is selected on nav tree
    await expect(
      await page
        .getByRole('treeitem', {name: 'Eliza, the friendly dolphin'})
        .getByTestId('side-menu-item'),
    ).toHaveAttribute('data-selected')

    // make sure first input has the right data
    await expect(await modal.getByTestId('string-input').inputValue()).toBe(
      'Eliza, the friendly dolphin',
    )

    // make sure breadcrumb shows the right item
    await expect(await modal.locator('#tree-breadcrumb-menu-button').textContent()).toBe(
      'Eliza, the friendly dolphin',
    )
  })
})
