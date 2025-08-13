import {readFileSync} from 'node:fs'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import {expect, type Page} from '@playwright/test'

import {createFileDataTransferHandle} from '../../helpers/createFileDataTransferHandle'
import {test} from '../../studio-test'

const fileName = 'capybara.jpg'
const image = readFileSync(
  path.join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'resources', fileName),
)

test(`file drop event should not propagate to dialog parent`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/content/input-standard;arraysTest')

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

  // Scroll list into view
  await list.scrollIntoViewIfNeeded()

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
  await createDraftDocument('/content/input-standard;arraysTest')

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

test(`Scenario: Adding new array item before using the context menu`, async ({
  page,
  createDraftDocument,
}) => {
  const {popoverMenu, popoverMenuItem, insertDialog, input, closeDialogButton, items} =
    createArrayFieldLocators(page)

  // Given an array field allowing multiple types
  await createDraftDocument('/content/input-standard;arraysTest')

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
  await expect(popoverMenu).toBeVisible()

  // And when the "Add item before.." menuitem is clicked
  const insertBeforeButton = popoverMenuItem('Add item before...')
  await insertBeforeButton.click()

  // Then an "insert menu" appears
  await expect(popoverMenu).toBeVisible()

  // And when the "Species" menuitem is clicked
  const speciesOption = popoverMenuItem('Species')
  await speciesOption.click()

  // Then the "insert dialog" appears
  await expect(insertDialog).toBeVisible()

  // And when the "Common name" input is filled with "Dog"
  input('Common name').fill('Dog')

  // And the "insert dialog" is closed
  await closeDialogButton.click()
  await insertDialog.isHidden()

  // Then a new "(Dog)Dog" is inserted before "Book titleBy <unknown>"
  await expect(items.first()).toHaveText('(Dog)Dog')
  await expect(items.nth(1)).toHaveText('Book titleBy <unknown>')
})

test(`Scenario: Adding new array item after using the context menu`, async ({
  page,
  createDraftDocument,
}) => {
  const {popoverMenu, popoverMenuItem, insertDialog, input, closeDialogButton, items} =
    createArrayFieldLocators(page)

  // Given an array field allowing multiple types
  await createDraftDocument('/content/input-standard;arraysTest')

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
  await expect(popoverMenu).toBeVisible()

  // And when the "Add item before.." menuitem is clicked
  const insertBeforeButton = popoverMenuItem('Add item after...')
  await insertBeforeButton.click()

  // Then an "insert menu" appears
  await expect(popoverMenu).toBeVisible()

  // And when the "Species" menuitem is clicked
  const speciesOption = popoverMenuItem('Species')
  await speciesOption.click()

  // Then the "insert dialog" appears
  await expect(insertDialog).toBeVisible()

  // And when the "Common name" input is filled with "Dog"
  input('Common name').fill('Cat')

  // And the "insert dialog" is closed
  await closeDialogButton.click()
  await insertDialog.isHidden()

  // Then a new "(Cat)Cat" is inserted after "Book titleBy <unknown>"
  await expect(items.first()).toHaveText('Book titleBy <unknown>')
  await expect(items.nth(1)).toHaveText('(Cat)Cat')
})

function createArrayFieldLocators(page: Page) {
  const field = page.getByTestId('field-arrayOfSoManyDifferentTypes')
  const content = field.locator('#arrayOfSoManyDifferentTypes')
  const items = content.locator('[data-ui="Grid"] > div')
  const addItemButton = field.getByRole('button', {name: 'Add item...'})
  const popover = page.getByTestId('document-panel-portal')
  const popoverMenu = popover.getByRole('menu')
  const popoverMenuItem = (name: string) => popoverMenu.getByRole('menuitem', {name})
  const insertDialog = page.getByRole('dialog')
  const input = (label: string) => insertDialog.getByLabel(label)
  const closeDialogButton = insertDialog.getByLabel('Close dialog')

  return {
    items,
    addItemButton,
    popoverMenu,
    popoverMenuItem,
    insertDialog,
    input,
    closeDialogButton,
  }
}

async function addInitialArrayItem(
  page: Page,
  item: {menuItemLabel: string; inputLabel: string; content: string},
) {
  const {
    addItemButton,
    popoverMenu,
    popoverMenuItem,
    insertDialog,
    input,
    closeDialogButton,
    items,
  } = createArrayFieldLocators(page)

  await addItemButton.click()
  await popoverMenu.isVisible()
  await popoverMenuItem(item.menuItemLabel).click()
  await insertDialog.isVisible()
  await input(item.inputLabel).fill(item.content)
  await closeDialogButton.click()
  await insertDialog.isHidden()
  const insertedItem = items.first()
  await insertedItem.isVisible()

  return insertedItem
}
