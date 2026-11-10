import {expect, type Page} from '@playwright/test'

/**
 * The document group inventory lists the document's existing variants (Published, Draft,
 * releases). It is rendered in the document group inspector, which is opened from the document
 * pane's context menu.
 */
export function getDocumentGroupInventory(page: Page) {
  return page.getByTestId('document-group-inventory')
}

/**
 * Open the document group inspector from the document pane's context menu.
 */
export async function openDocumentGroupInventory(page: Page) {
  const contextMenuButton = page
    .getByTestId('document-pane')
    .getByTestId('pane-context-menu-button')

  await expect(contextMenuButton).toBeVisible()
  await contextMenuButton.click()

  const manageVersionsMenuItem = page.getByTestId('action-manageversions')
  await expect(manageVersionsMenuItem).toBeVisible()
  await manageVersionsMenuItem.click()

  await expect(getDocumentGroupInventory(page)).toBeVisible()
}

/**
 * Close the document group inspector using the close button in its header.
 */
export async function closeDocumentGroupInventory(page: Page) {
  await page.getByRole('button', {name: 'Close panel'}).click()
  await expect(getDocumentGroupInventory(page)).toBeHidden()
}
