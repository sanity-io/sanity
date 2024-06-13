import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('navigation - tree sidebar', () => {
  test.beforeEach(async ({page, createDraftDocument, browserName}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat

    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await page.waitForSelector('[data-testid="document-panel-scroller"]', {
      state: 'attached',
      timeout: 40000,
    })
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.waitForSelector('[data-testid="field-animals"]', {state: 'visible'})
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    await modal.getByTestId('string-input').fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    await expect(modal).not.toBeVisible()

    // second element
    await page.waitForSelector('[data-testid="field-animals"]', {state: 'visible'})
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

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
    browserName,
  }) => {
    /* travelling from Albert, the Whale -> Lucy, the cat (sister item) via sidebar */

    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    // open first array item
    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // wait for the modal to open
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()
    await page.waitForSelector('[data-testid="tree-editing-sidebar"]', {state: 'visible'})

    // click on second array item in the sidebar
    await page
      .getByTestId('tree-editing-sidebar')
      .getByRole('button', {name: 'Lucy, the cat'})
      .click()

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

    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()
  })
})

test.describe('navigation - breadcrumb', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await page.waitForSelector('[data-testid="document-panel-scroller"]', {
      state: 'attached',
      timeout: 40000,
    })
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.waitForSelector('[data-testid="field-animals"]', {state: 'visible'})
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    await modal.getByTestId('string-input').fill('Albert, the whale')
    await page.getByRole('button', {name: 'Done'}).click()

    await expect(modal).not.toBeVisible()

    // second element
    await page.waitForSelector('[data-testid="field-animals"]', {state: 'visible'})
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

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
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    // click the breacrumb
    await page.locator('#tree-breadcrumb-menu-button').click()
    await page.waitForSelector('[data-ui="Popover__wrapper"]', {state: 'attached'})

    // navigate on second array item in breadcrumb
    // for some reason when trying to click playwright doesn't like the dropdown menu and doesn't let me select any
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()
    await page.waitForSelector('[data-testid="tree-editing-sidebar"]', {state: 'visible'})

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
    await expect(await modal.getByTestId('string-input').inputValue()).toBe('Lucy, the cat')

    // make sure breadcrumb shows the right item
    await expect(await modal.locator('#tree-breadcrumb-menu-button').textContent()).toBe(
      'Lucy, the cat',
    )
  })
})

test.describe('navigation - form', () => {
  test.beforeEach(async ({page, createDraftDocument, browserName}) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')
    // set up an array with two items: Albert, the whale and Lucy, the cat
    await createDraftDocument('/test/content/input-debug;objectsDebug')
    await page.waitForSelector('[data-testid="document-panel-scroller"]', {
      state: 'attached',
      timeout: 40000,
    })
    const modal = await page.getByTestId('tree-editing-dialog')

    // first element
    await page.waitForSelector('[data-testid="field-animals"]', {state: 'visible'})
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    await modal.getByTestId('string-input').fill('Albert, the whale')

    // add friend object
    await modal.getByTestId('add-single-object-button').click()

    // Wait for the animation to change form to finish
    await page.waitForFunction((selector) => {
      const element = document.querySelectorAll(selector)[1] as HTMLInputElement // first input in modal
      return element && element.value !== 'Albert, the whale'
    }, '[data-testid="string-input"]')

    // fill in the friend object
    await page.getByTestId('string-input').nth(1).fill('Eliza, the friendly dolphin')

    // click done
    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()

    /* structure:
    {
      Albert, the whale
        - Eliza, the friendly dolphin
    } */
  })

  test(`opening the first item, when you have an array with two objects in an object you should be able to navigate on the form side`, async ({
    page,
    browserName,
  }) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    /* travelling from Albert, the Whale (parent) -> Eliza, the friendly dolphin (first item) via form */
    await page.getByRole('button', {name: 'Albert, the whale'}).click()

    // wait for the modal to open
    await page.waitForSelector('[data-testid="tree-editing-dialog"]', {state: 'attached'})

    // click on friend item in array in the form
    await page
      .getByTestId('tree-editing-dialog-content')
      .getByRole('button', {name: 'Eliza, the friendly dolphin'})
      .click()

    // open sidebar
    await page.getByTestId('tree-editing-sidebar-toggle').click()
    await page.waitForSelector('[data-testid="tree-editing-sidebar"]', {state: 'visible'})

    // make sure that item is selected on nav tree
    await expect(
      await page
        .getByRole('treeitem', {name: 'Eliza, the friendly dolphin'})
        .getByTestId('side-menu-item'),
    ).toHaveAttribute('data-selected')

    // Wait for input not to be albert
    await page.waitForFunction((selector) => {
      const element = document.querySelectorAll(selector)[1] as HTMLInputElement // first input in modal
      return element && element.value !== 'Albert, the whale'
    }, '[data-testid="string-input"]')

    // make sure first input has the right data
    await expect(
      await page.locator('#tree-editing-form').getByTestId('string-input').inputValue(),
    ).toBe('Eliza, the friendly dolphin')

    // make sure breadcrumb shows the right item
    await expect(
      await page.getByRole('list').getByRole('button', {name: 'Eliza, the friendly dolphin'}),
    ).toBeVisible()

    const modal = await page.getByTestId('tree-editing-dialog')

    await page.getByRole('button', {name: 'Done'}).click()
    await expect(modal).not.toBeVisible()
  })
})
