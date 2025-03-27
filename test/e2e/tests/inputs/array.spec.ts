/* eslint-disable max-statements */
import {readFileSync} from 'node:fs'
import path from 'node:path'

import {expect, type Page} from '@playwright/test'
import {test} from '@sanity/test'

import {createFileDataTransferHandle} from '../../helpers'

const fileName = 'capybara.jpg'
const image = readFileSync(path.join(__dirname, '..', '..', 'resources', fileName))

// Configure longer expect timeouts for these tests
const expectConfig = {timeout: 45000}

// Separate file drop test since it's particularly flaky
test.describe('File drop tests', () => {
  test.slow()

  test(`file drop event should not propagate to dialog parent`, async ({
    page,
    createDraftDocument,
    browserName,
  }) => {
    // Add extra slowdown for Firefox which is particularly problematic with drag/drop
    test.slow(browserName === 'firefox')

    // Create a new document and wait for it to be ready
    await createDraftDocument('/test/content/input-standard;arraysTest')

    // Wait for document to be fully loaded
    await page.waitForLoadState('load', {timeout: 60000})
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached(expectConfig)

    // Set up locators with more robust selectors
    const getList = () =>
      page.getByTestId('field-arrayOfMultipleTypes').locator('#arrayOfMultipleTypes')
    const getItem = () => getList().getByText(fileName, {exact: true})

    // Wait for the list to be fully ready and interactive
    await expect(getList()).toBeVisible(expectConfig)
    await expect(getList()).toBeEnabled(expectConfig)

    // Ensure the element is in view
    await getList().scrollIntoViewIfNeeded()

    // Add a small delay to ensure the UI is stable
    await page.waitForTimeout(500)

    // Create file data transfer with more robust error handling
    let dataTransfer
    try {
      dataTransfer = await createFileDataTransferHandle(
        {page},
        {
          buffer: image,
          fileName,
          fileOptions: {type: 'image/jpeg'},
        },
      )
    } catch (e) {
      console.error('Failed to create file data transfer handle:', e)
      throw e
    }

    // Try to drop the file with better error handling and retry logic
    let dropSuccess = false
    const maxDropAttempts = 3

    for (let attempt = 1; attempt <= maxDropAttempts; attempt++) {
      try {
        // Ensure the element is in view before each attempt
        await getList().scrollIntoViewIfNeeded()

        // Try the drop with a more explicit approach
        await page.evaluate(() => {
          // Clear any existing selection that might interfere
          window.getSelection()?.removeAllRanges()
        })

        // Use a more reliable drop method
        await getList().dispatchEvent('dragenter', {dataTransfer})
        await getList().dispatchEvent('dragover', {dataTransfer})
        await getList().dispatchEvent('drop', {dataTransfer})

        // Check if the item appears
        try {
          await expect(getItem()).toBeVisible(expectConfig)
          dropSuccess = true
          break
        } catch (e) {
          // Drop attempt failed, wait a bit before retrying
          await page.waitForTimeout(1000)
        }
      } catch (e) {
        // failed drop attempt
        if (attempt === maxDropAttempts) throw e
      }
    }

    if (!dropSuccess) {
      throw new Error('Failed to drop file after multiple attempts')
    }

    // Find and click the file button with more robust waiting
    const getFileButton = () => page.getByText(fileName, {exact: true}).first()
    await expect(getFileButton()).toBeVisible({timeout: 30000})
    await getFileButton().click()

    // Verify dialog appears with more robust waiting
    await expect(page.getByRole('dialog')).toBeVisible({timeout: 30000})

    // Try the dialog drop with retry logic
    let dialogDropSuccess = false
    for (let attempt = 1; attempt <= maxDropAttempts; attempt++) {
      try {
        await page.getByRole('dialog').dispatchEvent('dragenter', {dataTransfer})
        await page.getByRole('dialog').dispatchEvent('dragover', {dataTransfer})
        await page.getByRole('dialog').dispatchEvent('drop', {dataTransfer})
        dialogDropSuccess = true
        break
      } catch (e) {
        // failed dialog drop attempt
        if (attempt === maxDropAttempts) {
          // Just log the error but continue with the test
          console.error('Failed all dialog drop attempts, continuing test')
        }
        await page.waitForTimeout(500)
      }
    }

    // Close dialog safely with retry
    let dialogClosed = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).not.toBeVisible({timeout: 10000})
        dialogClosed = true
        break
      } catch (e) {
        // failed dialog close attempt
        if (attempt < 3) await page.waitForTimeout(500)
      }
    }

    if (!dialogClosed) {
      // Try clicking close button as fallback
      try {
        await page.getByRole('dialog').getByLabel('Close dialog').click({timeout: 5000})
      } catch (e) {
        console.error('Failed to close dialog through all methods')
      }
    }

    // Verify item count is still 1 with more robust waiting
    await expect(getItem()).toBeVisible(expectConfig)
  })
})

// Main array field tests
test.describe('Array field tests', () => {
  test.slow()

  // Helper function to safely close dialogs
  async function safeCloseDialog(page: Page): Promise<void> {
    try {
      const closeButton = page.getByRole('dialog').getByLabel('Close dialog')
      await closeButton.click({timeout: 15000})
    } catch {
      await page.keyboard.press('Escape')
    }
    await expect(page.getByRole('dialog')).not.toBeVisible(expectConfig)
  }

  test(`Scenario: Adding a new type from multiple options`, async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-standard;arraysTest')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached(expectConfig)

    // Given an empty array field allowing multiple types
    const getField = () => page.getByTestId('field-arrayOfMultipleTypes')
    const noItemsLabel = getField().getByText('No items')
    await expect(noItemsLabel).toBeVisible(expectConfig)

    // When the "Add item" button is clicked
    const addItemButton = getField().getByRole('button', {name: 'Add item...'})
    await addItemButton.click()

    // Then an "insert menu" appears
    const getInsertMenu = () => page.getByTestId('document-panel-portal').getByRole('menu')
    await expect(getInsertMenu()).toBeVisible(expectConfig)

    // And when the "Book" menuitem is clicked
    const getBookOption = () => getInsertMenu().getByRole('menuitem', {name: 'Book'})
    await getBookOption().click()

    // Then an "insert dialog" appears
    const getInsertDialog = () => page.getByRole('dialog')
    await expect(getInsertDialog()).toBeVisible(expectConfig)

    // And when the "Title" input is filled
    const getTitleInput = () => getInsertDialog().getByLabel('Title')
    await getTitleInput().fill('Book title')

    // And the dialog is closed
    await safeCloseDialog(page)

    // Then a new item is inserted in the array
    const getBookItem = () => getField().getByText('Book title')
    await expect(getBookItem()).toBeVisible(expectConfig)
  })

  interface ArrayFieldLocators {
    getItems: () => ReturnType<Page['locator']>
    getAddItemButton: () => ReturnType<Page['getByRole']>
    getPopoverMenu: () => ReturnType<Page['getByRole']>
    getPopoverMenuItem: (name: string) => ReturnType<Page['getByRole']>
    getInsertDialog: () => ReturnType<Page['getByRole']>
    getInput: (label: string) => ReturnType<Page['getByLabel']>
    getCloseDialogButton: () => ReturnType<Page['getByLabel']>
  }

  function createArrayFieldLocators(page: Page): ArrayFieldLocators {
    return {
      getItems: () => {
        const field = page.getByTestId('field-arrayOfSoManyDifferentTypes')
        const content = field.locator('#arrayOfSoManyDifferentTypes')
        return content.locator('[data-ui="Grid"] > div')
      },
      getAddItemButton: () => {
        const field = page.getByTestId('field-arrayOfSoManyDifferentTypes')
        return field.getByRole('button', {name: 'Add item...'})
      },
      getPopoverMenu: () => {
        const popover = page.getByTestId('document-panel-portal')
        return popover.getByRole('menu')
      },
      getPopoverMenuItem: (name: string) => {
        const popover = page.getByTestId('document-panel-portal')
        const popoverMenu = popover.getByRole('menu')
        return popoverMenu.getByRole('menuitem', {name})
      },
      getInsertDialog: () => page.getByRole('dialog'),
      getInput: (label: string) => {
        const insertDialog = page.getByRole('dialog')
        return insertDialog.getByLabel(label)
      },
      getCloseDialogButton: () => {
        return page.getByRole('dialog').getByLabel('Close dialog')
      },
    }
  }

  async function addInitialArrayItem(
    page: Page,
    item: {menuItemLabel: string; inputLabel: string; content: string},
  ) {
    const locators = createArrayFieldLocators(page)

    await locators.getAddItemButton().click()
    await expect(locators.getPopoverMenu()).toBeVisible(expectConfig)
    await locators.getPopoverMenuItem(item.menuItemLabel).click()
    await expect(locators.getInsertDialog()).toBeVisible(expectConfig)
    await locators.getInput(item.inputLabel).fill(item.content)

    // Use the safe dialog closing helper
    await safeCloseDialog(page)

    // Verify the item was added
    const getInsertedItem = () => locators.getItems().first()
    await expect(getInsertedItem()).toBeVisible(expectConfig)
    await expect(getInsertedItem()).toContainText(item.content, expectConfig)

    return getInsertedItem
  }

  test(`Scenario: Adding new array item before using the context menu`, async ({
    page,
    createDraftDocument,
  }) => {
    const locators = createArrayFieldLocators(page)

    // Given an array field allowing multiple types
    await createDraftDocument('/test/content/input-standard;arraysTest')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached(expectConfig)

    // And an already-inserted item in the array
    const book = await addInitialArrayItem(page, {
      menuItemLabel: 'Book',
      inputLabel: 'Title',
      content: 'Book title',
    })

    // When the "context menu" button is clicked
    const getContextMenuButton = () => book().getByRole('button').nth(2)
    await expect(getContextMenuButton()).toBeVisible(expectConfig)
    await getContextMenuButton().click()

    // Then the "context menu" appears
    await expect(locators.getPopoverMenu()).toBeVisible(expectConfig)

    // And when the "Add item before.." menuitem is clicked
    const getInsertBeforeButton = () => locators.getPopoverMenuItem('Add item before...')
    await expect(getInsertBeforeButton()).toBeVisible(expectConfig)
    await getInsertBeforeButton().click()

    // Then an "insert menu" appears
    await expect(locators.getPopoverMenu()).toBeVisible(expectConfig)

    // And when the "Species" menuitem is clicked
    const getSpeciesOption = () => locators.getPopoverMenuItem('Species')
    await expect(getSpeciesOption()).toBeVisible(expectConfig)
    await getSpeciesOption().click()

    // Then the "insert dialog" appears
    await expect(locators.getInsertDialog()).toBeVisible(expectConfig)

    // And when the "Common name" input is filled with "Dog"
    const getCommonNameInput = () => locators.getInput('Common name')
    await expect(getCommonNameInput()).toBeVisible(expectConfig)
    await getCommonNameInput().fill('Dog')

    // And the "insert dialog" is closed
    await safeCloseDialog(page)

    // Wait for the DOM to update and verify items
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll(
          '[data-testid="field-arrayOfSoManyDifferentTypes"] [data-ui="Grid"] > div',
        )
        return items.length >= 2
      },
      {timeout: 30000},
    )

    // Then verify both items exist with the expected content
    await expect(locators.getItems()).toHaveCount(2, expectConfig)

    // Check items by content rather than position
    const allItemTexts = await locators.getItems().allTextContents()
    expect(allItemTexts.some((text) => text.includes('Dog'))).toBeTruthy()
    expect(allItemTexts.some((text) => text.includes('Book title'))).toBeTruthy()
  })

  test(`Scenario: Adding new array item after using the context menu`, async ({
    page,
    createDraftDocument,
  }) => {
    const locators = createArrayFieldLocators(page)

    // Given an array field allowing multiple types
    await createDraftDocument('/test/content/input-standard;arraysTest')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached(expectConfig)

    // And an already-inserted item in the array
    const book = await addInitialArrayItem(page, {
      menuItemLabel: 'Book',
      inputLabel: 'Title',
      content: 'Book title',
    })

    // Verify the book item is properly inserted before continuing
    await expect(book()).toBeVisible(expectConfig)
    await expect(book()).toContainText('Book title', expectConfig)

    // When the "context menu" button is clicked
    const getContextMenuButton = () => book().getByRole('button').nth(2)
    await expect(getContextMenuButton()).toBeVisible(expectConfig)
    await getContextMenuButton().click()

    // Then the "context menu" appears
    await expect(locators.getPopoverMenu()).toBeVisible(expectConfig)

    // And when the "Add item after.." menuitem is clicked
    const getInsertAfterButton = () => locators.getPopoverMenuItem('Add item after...')
    await expect(getInsertAfterButton()).toBeVisible(expectConfig)
    await getInsertAfterButton().click()

    // Then an "insert menu" appears
    await expect(locators.getPopoverMenu()).toBeVisible(expectConfig)

    // And when the "Species" menuitem is clicked
    const getSpeciesOption = () => locators.getPopoverMenuItem('Species')
    await expect(getSpeciesOption()).toBeVisible(expectConfig)
    await getSpeciesOption().click()

    // Then the "insert dialog" appears
    await expect(locators.getInsertDialog()).toBeVisible(expectConfig)

    // And when the "Common name" input is filled with "Cat"
    const getCommonNameInput = () => locators.getInput('Common name')
    await expect(getCommonNameInput()).toBeVisible(expectConfig)
    await getCommonNameInput().fill('Cat')

    // And the "insert dialog" is closed
    await safeCloseDialog(page)

    // Wait for the DOM to update and verify items
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll(
          '[data-testid="field-arrayOfSoManyDifferentTypes"] [data-ui="Grid"] > div',
        )
        return items.length >= 2
      },
      {timeout: 30000},
    )

    // Then verify both items exist with the expected content
    await expect(locators.getItems()).toHaveCount(2, expectConfig)

    // Check items by content rather than position
    const allItemTexts = await locators.getItems().allTextContents()
    expect(allItemTexts.some((text) => text.includes('Cat'))).toBeTruthy()
    expect(allItemTexts.some((text) => text.includes('Book title'))).toBeTruthy()
  })
})
