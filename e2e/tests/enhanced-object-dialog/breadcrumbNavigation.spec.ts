import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Enhanced Object Dialog - breadcrumb navigation', () => {
  test.beforeEach(async ({createDraftDocument, page, browserName}) => {
    test.skip(browserName === 'firefox')
    test.slow()

    await createDraftDocument('/content/input-debug;objectsDebug')

    // Create "Blue whale" animal
    await page.getByTestId('field-animals').getByRole('button', {name: 'Add item'}).click()
    const modal = page.getByTestId('nested-object-dialog')
    await expect(modal).toBeVisible()

    const nameInput = modal
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.name$/)
      .getByTestId('string-input')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Blue whale')

    // Add a friend "Dolphin" inside Blue whale
    const addFriendButton = modal
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.friends$/)
      .getByRole('button', {name: 'Add item'})
    await addFriendButton.scrollIntoViewIfNeeded()
    await addFriendButton.click()

    // Fill the friend name (now inside a second-level dialog)
    const friendNameInput = page
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.friends\[_key=="[^"]+"\]\.name$/)
      .getByTestId('string-input')
    await expect(friendNameInput).toBeVisible()
    await friendNameInput.fill('Dolphin')
  })

  test('navigating back via breadcrumb then re-opening a sibling item keeps the dialog stable', async ({
    page,
  }) => {
    // We're currently viewing the Dolphin friend dialog.
    // Navigate back to Blue whale via the breadcrumb.
    const topDialog = page.getByTestId('nested-object-dialog').last()
    await topDialog.getByTestId('breadcrumb-item-blue-whale').click()

    // Should still have a dialog open (at the Blue whale level)
    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

    // The Dolphin friend name field should no longer be visible (we navigated up)
    const friendNameField = page
      .getByTestId(/^field-animals\[_key=="[^"]+"\]\.friends\[_key=="[^"]+"\]\.name$/)
      .getByTestId('string-input')
    await expect(friendNameField).not.toBeVisible()

    // Now click the Dolphin friend item to re-open it
    const dolphinButton = page
      .getByTestId('nested-object-dialog')
      .getByRole('button', {name: /Dolphin/})
    await dolphinButton.scrollIntoViewIfNeeded()
    await dolphinButton.click()

    // The dialog should remain visible and stable (no flicker back to Blue whale)
    await expect(friendNameField).toBeVisible()
    await expect(friendNameField).toHaveValue('Dolphin')

    // Verify it stays stable after a short wait (catches flicker regressions)
    await page.waitForTimeout(500)
    await expect(friendNameField).toBeVisible()
    await expect(friendNameField).toHaveValue('Dolphin')
  })
})
