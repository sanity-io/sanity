import {expect, type Locator} from '@playwright/test'

import {test} from '../../studio-test'

/**
 * Helper to check if a menu item has the checkmark icon (selected state)
 */
async function expectCheckmark(menuItem: Locator, shouldHaveCheckmark: boolean) {
  const checkmark = menuItem.locator('svg[data-sanity-icon="checkmark"]')
  if (shouldHaveCheckmark) {
    await expect(checkmark).toBeVisible()
  } else {
    await expect(checkmark).not.toBeVisible()
  }
}

test.describe('Menu item selected indicator', () => {
  test.beforeEach(async ({page, baseURL}) => {
    // Navigate to the Menu item selected indicator list item
    await page.goto(`${baseURL}/content/menu-item-selected-indicator`)
    await expect(page.getByTestId('document-list-pane')).toBeVisible()
  })

  test('radio-button behavior: selecting one option deselects others', async ({page}) => {
    // Open the context menu
    await page.getByTestId('pane-context-menu-button').click()

    // Initially no view mode should be selected
    const defaultOption = page.getByRole('menuitem', {name: 'View Mode: Default'})
    const compactOption = page.getByRole('menuitem', {name: 'View Mode: Compact'})
    const expandedOption = page.getByRole('menuitem', {name: 'View Mode: Expanded'})

    await expect(defaultOption).toBeVisible()
    await expect(compactOption).toBeVisible()
    await expect(expandedOption).toBeVisible()

    // Click "View Mode: Default" - should show checkmark
    await defaultOption.click()

    // Re-open menu to verify selection
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(defaultOption, true)
    await expectCheckmark(compactOption, false)
    await expectCheckmark(expandedOption, false)

    // Click "View Mode: Compact" - should switch checkmark
    await compactOption.click()

    // Re-open menu to verify selection changed
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(defaultOption, false)
    await expectCheckmark(compactOption, true)
    await expectCheckmark(expandedOption, false)

    // Click "View Mode: Compact" again - should deselect (toggle off)
    await compactOption.click()

    // Re-open menu to verify deselection
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(defaultOption, false)
    await expectCheckmark(compactOption, false)
    await expectCheckmark(expandedOption, false)
  })

  test('checkbox behavior: multiple options can be selected independently', async ({page}) => {
    // Open the context menu
    await page.getByTestId('pane-context-menu-button').click()

    const showArchived = page.getByRole('menuitem', {name: 'Show Archived'})
    const showFeatured = page.getByRole('menuitem', {name: 'Show Featured'})

    await expect(showArchived).toBeVisible()
    await expect(showFeatured).toBeVisible()

    // Click "Show Archived" - should show checkmark
    await showArchived.click()

    // Re-open menu to verify selection
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(showArchived, true)
    await expectCheckmark(showFeatured, false)

    // Click "Show Featured" - both should now be selected
    await showFeatured.click()

    // Re-open menu to verify both are selected
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(showArchived, true)
    await expectCheckmark(showFeatured, true)

    // Click "Show Archived" again - should toggle off, but Featured stays selected
    await showArchived.click()

    // Re-open menu to verify
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(showArchived, false)
    await expectCheckmark(showFeatured, true)
  })

  test('menu item with action runs the action and shows selected state', async ({page}) => {
    // Set up dialog handler before clicking
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('you clicked!')
      await dialog.accept()
    })

    // Open the context menu
    await page.getByTestId('pane-context-menu-button').click()

    const alertAction = page.getByRole('menuitem', {name: 'Alert action'})
    await expect(alertAction).toBeVisible()

    // Click the action - should trigger alert and toggle selected state
    await alertAction.click()

    // Re-open menu to verify selected state after action ran
    await page.getByTestId('pane-context-menu-button').click()
    await expectCheckmark(page.getByRole('menuitem', {name: 'Alert action'}), true)
  })

  test('menu item with hideSelectionIndicator does not show selection indicator', async ({
    page,
  }) => {
    // Open the context menu
    await page.getByTestId('pane-context-menu-button').click()

    const noSelectionIndicator = page.getByRole('menuitem', {name: 'No selection indicator'})
    await expect(noSelectionIndicator).toBeVisible()

    // Click the action - should not trigger alert and should not show selection indicator
    await noSelectionIndicator.click()
  })
})
