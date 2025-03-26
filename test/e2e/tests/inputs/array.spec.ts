import {readFileSync} from 'node:fs'
import path from 'node:path'

import {expect, type Page} from '@playwright/test'
import {test} from '@sanity/test'

import {createFileDataTransferHandle} from '../../helpers'

const fileName = 'capybara.jpg'
const image = readFileSync(path.join(__dirname, '..', '..', 'resources', fileName))

test(`file drop event should not propagate to dialog parent`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-standard;arraysTest')

  await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
    timeout: 40000,
  })
  const list = page.getByTestId('field-arrayOfMultipleTypes').locator('#arrayOfMultipleTypes')
  const item = list.locator('[data-ui="Grid"] > div')

  const dataTransfer = await createFileDataTransferHandle(
    {page},
    {
      buffer: image,
      fileName,
      fileOptions: {
        type: 'image/jpeg',
      },
    },
  )

  await expect(list).toBeVisible()

  // Drop the file.
  await list.dispatchEvent('drop', {dataTransfer})

  // Ensure the list contains one item.
  expect(item).toHaveCount(1)

  // Open the dialog.
  await page.getByRole('button', {name: fileName}).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  // Drop the file again; this time, while the dialog is open.
  //
  // - The drop event should not propagate to the parent.
  // - Therefore, the drop event should not cause the image to be added to the list again.
  await page.getByRole('dialog').dispatchEvent('drop', {dataTransfer})

  // Close the dialog.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Ensure the list still contains one item.
  expect(item).toHaveCount(1)
})

test(`Scenario: Adding a new type from multiple options`, async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/input-standard;arraysTest')

  await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
    timeout: 40000,
  })

  // Given an empty array field allowing multiple types
  const field = page.getByTestId('field-arrayOfMultipleTypes')
  const noItemsLabel = field.getByText('No items')
  await expect(noItemsLabel).toBeVisible()

  // When the "Add item" button is clicked
  const addItemButton = field.getByRole('button', {name: 'Add item...'})
  await addItemButton.click()

  // Then an "insert menu" appears
  const insertMenuPopover = page.getByTestId('document-panel-portal')
  const insertMenu = insertMenuPopover.getByRole('menu')
  await expect(insertMenu).toBeVisible()

  // And when the "Book" menuitem is clicked
  const bookOption = insertMenu.getByRole('menuitem', {name: 'Book'})
  await bookOption.click()

  // Then an "insert dialog" appears
  const insertDialog = page.getByRole('dialog')
  await expect(insertDialog).toBeVisible()

  // And when the "Title" input is filled
  const titleInput = insertDialog.getByLabel('Title')
  await titleInput.fill('Book title')
  await expect(titleInput).toHaveValue('Book title')

  // And the dialog is closed
  const closeDialogButton = insertDialog.getByLabel('Close dialog')
  await closeDialogButton.click()
  await expect(insertDialog).not.toBeVisible()

  // Then a new item is inserted in the array
  const bookItem = field.getByText('Book title')
  await expect(bookItem).toBeVisible()
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
      const insertDialog = page.getByRole('dialog')
      return insertDialog.getByLabel('Close dialog')
    },
  }
}

async function addInitialArrayItem(
  page: Page,
  item: {menuItemLabel: string; inputLabel: string; content: string},
) {
  const locators = createArrayFieldLocators(page)

  await locators.getAddItemButton().click()
  await locators.getPopoverMenu().isVisible()
  await locators.getPopoverMenuItem(item.menuItemLabel).click()
  await locators.getInsertDialog().isVisible()
  await locators.getInput(item.inputLabel).fill(item.content)
  await locators.getCloseDialogButton().click()
  await locators.getInsertDialog().isHidden()
  const insertedItem = locators.getItems().first()
  await insertedItem.isVisible()

  return insertedItem
}

test(`Scenario: Adding new array item before using the context menu`, async ({
  page,
  createDraftDocument,
}) => {
  const locators = createArrayFieldLocators(page)

  // Given an array field allowing multiple types
  await createDraftDocument('/test/content/input-standard;arraysTest')

  await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
    timeout: 40000,
  })

  // And an already-inserted item in the array
  const book = await addInitialArrayItem(page, {
    menuItemLabel: 'Book',
    inputLabel: 'Title',
    content: 'Book title',
  })

  // When the "context menu" button is clicked
  const contextMenuButton = book.getByRole('button').nth(2)
  await contextMenuButton.click()

  // Then the "context menu" appears
  await expect(locators.getPopoverMenu()).toBeVisible()

  // And when the "Add item before.." menuitem is clicked
  const insertBeforeButton = locators.getPopoverMenuItem('Add item before...')
  await insertBeforeButton.click()

  // Then an "insert menu" appears
  await expect(locators.getPopoverMenu()).toBeVisible()

  // And when the "Species" menuitem is clicked
  const speciesOption = locators.getPopoverMenuItem('Species')
  await speciesOption.click()

  // Then the "insert dialog" appears
  await expect(locators.getInsertDialog()).toBeVisible()

  // And when the "Common name" input is filled with "Dog"
  locators.getInput('Common name').fill('Dog')

  // And the "insert dialog" is closed
  await locators.getCloseDialogButton().click()
  await locators.getInsertDialog().isHidden()

  // Then a new "(Dog)Dog" is inserted before "Book titleBy <unknown>"
  await expect(locators.getItems().first()).toHaveText('(Dog)Dog')
  await expect(locators.getItems().nth(1)).toHaveText('Book titleBy <unknown>')
})

test(`Scenario: Adding new array item after using the context menu`, async ({
  page,
  createDraftDocument,
}) => {
  const locators = createArrayFieldLocators(page)

  // Given an array field allowing multiple types
  await createDraftDocument('/test/content/input-standard;arraysTest')

  await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
    timeout: 40000,
  })

  // And an already-inserted item in the array
  const book = await addInitialArrayItem(page, {
    menuItemLabel: 'Book',
    inputLabel: 'Title',
    content: 'Book title',
  })

  // When the "context menu" button is clicked
  const contextMenuButton = book.getByRole('button').nth(2)
  await contextMenuButton.click()

  // Then the "context menu" appears
  await expect(locators.getPopoverMenu()).toBeVisible()

  // And when the "Add item before.." menuitem is clicked
  const insertBeforeButton = locators.getPopoverMenuItem('Add item after...')
  await insertBeforeButton.click()

  // Then an "insert menu" appears
  await expect(locators.getPopoverMenu()).toBeVisible()

  // And when the "Species" menuitem is clicked
  const speciesOption = locators.getPopoverMenuItem('Species')
  await speciesOption.click()

  // Then the "insert dialog" appears
  await expect(locators.getInsertDialog()).toBeVisible()

  // And when the "Common name" input is filled with "Dog"
  locators.getInput('Common name').fill('Cat')

  // And the "insert dialog" is closed
  await locators.getCloseDialogButton().click()
  await locators.getInsertDialog().isHidden()

  // Then a new "(Cat)Cat" is inserted after "Book titleBy <unknown>"
  await expect(locators.getItems().first()).toHaveText('Book titleBy <unknown>')
  await expect(locators.getItems().nth(1)).toHaveText('(Cat)Cat')
})
