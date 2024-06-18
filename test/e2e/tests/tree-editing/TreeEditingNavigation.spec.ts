import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('navigation - tree sidebar', () => {
  test.beforeEach(async ({page, createDraftDocument, browserName}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat

    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // first element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    await page
      .getByTestId('tree-editing-dialog')
      .getByTestId('string-input')
      .fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    // wait for modal to close
    page.on('dialog', async () => {
      await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    })

    // second element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    await page.getByTestId('tree-editing-dialog').getByTestId('string-input').fill('Lucy, the cat')
    await page.getByRole('button', {name: 'Done'}).click()

    // wait for modal to close
    page.on('dialog', async () => {
      await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    })
    /* structure:
      {
        Albert, the whale
        Lucy, the cat
      } */
  })

  // first level array item test
  test(`opening the first item, you should be able to navigate to the second array item`, async ({
    page,
    browserName,
  }) => {
    /* travelling from Albert, the Whale -> Lucy, the cat (sister item) via sidebar */

    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    // open first array item
    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // wait for the modal to open
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()
    await expect(page.getByTestId('sidebar-tree-list')).toBeVisible()

    // click on second array item in the sidebar
    await page.getByTestId('sidebar-tree-list').getByRole('button', {name: 'Lucy, the cat'}).click()

    // Wait for the animation to change form to finish
    const elementSelector = '[data-testid="tree-editing-dialog-content"]' // element that is animated

    // Wait for opacity to turn 0
    await page.waitForFunction((selector) => {
      const element = document.querySelector(selector)
      return element && getComputedStyle(element).opacity !== '1'
    }, elementSelector)

    // Wait for opacity to turn 1
    await page.waitForFunction((selector) => {
      const element = document.querySelector(selector)
      return element && getComputedStyle(element).opacity === '1'
    }, elementSelector)

    // make sure that item is selected on nav tree
    await expect(
      await page.getByRole('treeitem', {name: 'Lucy, the cat'}).getByTestId('side-menu-item'),
    ).toHaveAttribute('data-selected')

    // Wait for input not to be albert
    await page.waitForFunction((selector) => {
      const element = document.querySelectorAll(selector)[1] as HTMLInputElement // first input in modal
      return element && element.value !== 'Albert, the whale'
    }, '[data-testid="string-input"]')

    // make sure first input has the right data
    await expect(
      await page.locator('#tree-editing-form').getByTestId('string-input').inputValue(),
    ).toBe('Lucy, the cat')

    // make sure breadcrumb shows the right item
    await expect(await page.locator('#tree-breadcrumb-menu-button').textContent()).toBe(
      'Lucy, the cat',
    )

    await page.getByRole('button', {name: 'Done'}).click()

    // wait for the modal to close
    page.on('dialog', async () => {
      await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    })
  })
})

test.describe('navigation - breadcrumb', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // first element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    await page
      .getByTestId('tree-editing-dialog')
      .getByTestId('string-input')
      .fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    // wait for the modal to close
    page.on('dialog', async () => {
      await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    })

    // second element
    await expect(page.getByTestId('field-animals')).toBeVisible()
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    await page.getByTestId('tree-editing-dialog').getByTestId('string-input').fill('Lucy, the cat')
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

    await page.getByRole('button', {name: 'Albert, the whale'}).click()
    await expect(page.getByTestId('tree-editing-dialog')).toBeAttached()

    // click the breacrumb
    await page.locator('#tree-breadcrumb-menu-button').click()
    await expect(page.locator('[data-ui="Popover__wrapper"]')).toBeAttached()

    // navigate on second array item in breadcrumb
    // for some reason when trying to click playwright doesn't like the dropdown menu and doesn't let me select any
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()
    await expect(page.getByTestId('sidebar-tree-list')).toBeVisible()

    // make sure that item is selected on nav tree
    await expect(
      await page.getByRole('treeitem', {name: 'Lucy, the cat'}).getByTestId('side-menu-item'),
    ).toHaveAttribute('data-selected')

    // Wait for input not to be albert
    await page.waitForFunction((selector) => {
      const element = document.querySelectorAll(selector)[1] as HTMLInputElement // first input in modal
      return element && element.value !== 'Albert, the whale'
    }, '[data-testid="string-input"]')

    // make sure first input has the right data
    await expect(
      await page.getByTestId('tree-editing-dialog').getByTestId('string-input').inputValue(),
    ).toBe('Lucy, the cat')

    // make sure breadcrumb shows the right item
    await expect(
      await page
        .getByTestId('tree-editing-dialog')
        .locator('#tree-breadcrumb-menu-button')
        .textContent(),
    ).toBe('Lucy, the cat')
  })
})
