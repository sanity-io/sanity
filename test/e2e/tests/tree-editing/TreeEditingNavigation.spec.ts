import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {waitForOpacityChange} from '../utils/waitForOpacityChange'

test.beforeEach(async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-debug;objectsDebug')

  await page
    .getByTestId('field-animals')
    .getByRole('button', {name: 'Add item'})
    .click({timeout: 12000})
})

test.describe('basic - open and close', () => {
  test(`opening - when creating new array item, the tree editing modal should open`, async ({
    page,
  }) => {
    const modal = await page.getByTestId('tree-editing-dialog')
    await expect(modal).toBeVisible()
  })

  test(`closing - when the modal is open, clicking the 'done button' will close it`, async ({
    page,
  }) => {
    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()
  })
})

test.describe('actions', () => {
  test(`actions - blocked main document action when modal is open`, async ({page}) => {
    await expect(page.getByTestId('action-Publish')).toBeDisabled()
  })

  test(`actions - main document action when modal is closed will be enabled`, async ({page}) => {
    await page.getByTestId('tree-editing-done').click()

    await expect(page.getByTestId('action-Publish')).not.toBeDisabled()
  })
})

test.describe('navigation - tree sidebar', () => {
  test.beforeEach(async ({page}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat

    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
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
  test.beforeEach(async ({page}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat

    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
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
  test.beforeEach(async ({page}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat

    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await modal.getByTestId('string-input').fill('Albert, the whale')

    // add first child item, friends
    await modal.getByTestId('add-single-object-button').nth(0).click()

    const selector = [
      '[data-testid^="field-animals[_key="]',
      '[data-testid*="].friends[_key="]',
      '[data-testid$="].name"]',
    ].join('')

    await page
      .locator(selector)
      .getByTestId('string-input')
      .fill('Eliza, the friendly dolphin', {timeout: 15000})

    //open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()

    // return to parent item
    await page.getByRole('list').getByRole('button', {name: 'Albert, the whale'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // add new child item, friends
    await modal.getByTestId('add-single-object-button').nth(0).click()

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

    await modal.getByRole('button', {name: 'Eliza, the friendly dolphin'}).click({timeout: 12000})

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

  test('opening an item of array with exceptions in a nested array with new solution', async ({
    page,
  }) => {
    /* travelling from Albert, the Whale (parent) -> Eliza, the friendly dolphin (first item) -> properties -> exceptionArray */
    const modal = await page.getByTestId('tree-editing-dialog')

    const modalMadness = await page.getByLabel('Edit Exception array')

    // navigation
    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    await modal.getByRole('button', {name: 'Eliza, the friendly dolphin'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // navigate to properties
    const selector = [
      '[data-testid^="field-animals[_key="]',
      '[data-testid*="].friends[_key="]',
      '[data-testid$="].properties"]',
    ].join('')

    await modal.locator(selector).getByTestId('add-single-object-button').click({timeout: 20000})

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 10000)

    await modal.getByRole('button', {name: 'Untitled'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // navigate to properties (with exceptions)
    const selectorExceptionArray =
      '[data-testid^="field-animals"][data-testid*=".friends"][data-testid*=".properties"][data-testid$=".exceptionArray"]'

    await page.locator(selectorExceptionArray).getByTestId('add-single-object-button').click()

    // the new solution is attached
    await expect(modal).toBeAttached()
    // old modal is attached
    await expect(modalMadness).toBeAttached()
  })

  test('add a new item in an inline preview (will not open any modals)', async ({page}) => {
    /* travelling from Albert, the Whale (parent) -> Eliza, the friendly dolphin (first item) -> properties -> exceptionArray */
    const modal = await page.getByTestId('tree-editing-dialog')

    const modalMadness = await page.getByLabel('Edit Exception array')

    // navigation
    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // Wait for the animation to change form to finish
    await waitForOpacityChange(page, '[data-testid="tree-editing-dialog-content"]', 5000)

    // navigate to physical attributes
    const selector = '[data-testid^="field-animals"][data-testid$="arrayInlineObject"]'

    await modal.locator(selector).getByTestId('add-single-object-button').click()

    const selectorTitle = '[data-testid^="field-animals"][data-testid$="title"]'

    await modal.locator(selectorTitle).getByTestId('string-input').fill('My title')

    // you can still edit the field
    await expect(modal.locator(selectorTitle).getByTestId('string-input')).toHaveValue('My title')
    // the new solution is attached
    await expect(modal).toBeAttached()
    // old modal is attached
    await expect(modalMadness).not.toBeAttached()
  })
})

test.describe('navigation - with exceptions', () => {
  test.beforeEach(async ({page}) => {
    await page.getByRole('button', {name: 'Done'}).click()
  })

  test('opening an item of array with exceptions should open old modal madness solution', async ({
    page,
  }) => {
    // create array item
    await page
      .getByTestId('field-arrayOfObjectException')
      .getByTestId('add-single-object-button')
      .click({timeout: 12000})

    // old modal
    const modalMadness = page
      .getByTestId('document-panel-portal')
      .locator('div')
      .filter({hasText: 'Edit My ObjectString'})
      .nth(1)

    await expect(modalMadness).toBeAttached()
  })

  test('opening an item of array with exceptions (with inline preview) will not open the new solution', async ({
    page,
  }) => {
    const modal = await page.getByTestId('tree-editing-dialog')

    // create array item
    await page
      .getByTestId('field-arrayInlineObject')
      .getByTestId('add-single-object-button')
      .click({timeout: 12000})

    // old modal
    const modalMadness = await page
      .getByTestId('document-panel-portal')
      .locator('div')
      .filter({hasText: 'Edit My ObjectString'})
      .nth(1)

    const selectorTitle = '[data-testid^="field-arrayInlineObject"] [data-testid$=".title"]'

    await page.locator(selectorTitle).getByTestId('string-input').fill('My title')

    await expect(page.locator(selectorTitle).getByTestId('string-input')).toHaveValue('My title')
    await expect(modal).not.toBeAttached()
    await expect(modalMadness).not.toBeAttached()
  })
})
