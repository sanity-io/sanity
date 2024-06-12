import {expect, test} from '@playwright/experimental-ct-react'

import {TreeEditingStory} from './TreeEditingStory'

test.describe('Tree editing', () => {
  test('should open dialog when adding an item and close it when clicking done', async ({
    mount,
    page,
  }) => {
    await mount(<TreeEditingStory />)

    // Add an item
    await page.getByTestId('add-single-object-button').click()

    // Wait for the dialog to be visible
    await expect(page.getByTestId('tree-editing-dialog')).toBeVisible()

    // Click done
    await page.getByTestId('tree-editing-done').click()

    // Wait for the dialog to be hidden
    await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
  })

  test('should open edit portal dialog when tree editing is disabled in schema', async ({
    mount,
    page,
  }) => {
    await mount(<TreeEditingStory legacyEditing />)

    // Add an item
    await page.getByTestId('add-single-object-button').click()

    // Test that the legacy dialog is visible and the tree editing dialog is not
    await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    await expect(page.getByTestId('edit-portal-dialog')).toBeVisible()
  })

  // test('should show item in tree menu after adding it', async ({mount, page}) => {
  //   await mount(<TreeEditingStory />)
  //   const {typeWithDelay} = testHelpers({page})

  //   // Add an item
  //   await page.getByTestId('add-single-object-button').click()

  //   await expect(page.getByTestId('tree-editing-dialog')).toBeVisible()

  //   const input = page.getByTestId('string-input')

  //   await input.focus()

  //   // Type in title
  //   await typeWithDelay('My title')

  //   // Open sidebar
  //   await page.getByTestId('tree-editing-sidebar-toggle').click()

  //   // Wait for the sidebar to be visible after animation
  //   await page.waitForTimeout(500)

  //   const sidebar = page.getByTestId('tree-editing-sidebar')

  //   // Get first button in the sidebar and

  //   // Wait for the sidebar to be visible
  //   await expect(sidebar).toBeVisible()
  // })
})
