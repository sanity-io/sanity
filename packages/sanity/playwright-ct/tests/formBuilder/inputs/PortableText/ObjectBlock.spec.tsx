import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import {ObjectBlockStory} from './ObjectBlockStory'

test.describe('Portable Text Input', () => {
  test.describe('Object blocks', () => {
    test('Clicking a block link in the menu create a new block element', async ({mount, page}) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($portableTextInput.locator('.pt-block.pt-object-block')).toBeVisible()
    })

    test('Custom block preview components renders correctly', async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      await mount(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()

      // Assertion: Object preview should be visible
      await expect($pte.getByTestId('inline-preview')).toBeVisible()

      // Assertion: Text in custom preview component should show
      await expect($pte.getByText('Custom preview block:')).toBeVisible()
    })

    test('Double-clicking opens a block', async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($pte.locator('.pt-block.pt-object-block')).toBeVisible()

      const $locatorDialog = page.getByTestId('default-edit-object-dialog')

      // Assertion: Object edit dialog should be visible
      await expect($locatorDialog).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await page.keyboard.press('Escape')

      // Dialog should now be gone
      await expect($locatorDialog).toBeHidden()

      // Test that we can open dialog by double clicking
      await $pte.getByTestId('pte-block-object').dblclick()

      // Assertion: Object edit dialog should be visible
      await expect($locatorDialog).toBeVisible()
    })

    test('Blocks should be accessible via block context menu', async ({mount, page}) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $portableTextField = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($portableTextField.locator('.pt-block.pt-object-block')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('default-edit-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await page.keyboard.press('Escape')

      // Dialog should now be gone
      await expect(page.getByTestId('default-edit-object-dialog')).toBeHidden()

      // Tab to the context menu, press enter once to open it, then enter again to press 'edit'
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', {name: 'Open menu'})).toBeFocused()
      await page.keyboard.press('Enter')

      // Assertion: Context menu should be open
      const $locatorContextMenu = page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')
      await expect($locatorContextMenu.locator('*:focus', {hasText: 'Edit'})).toBeFocused()

      await page.keyboard.press('Enter')

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('default-edit-object-dialog')).toBeVisible()

      // Close dialog
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200) // Confirm with @skogsmaskin if there is a better way
      await expect(page.getByTestId('default-edit-object-dialog')).not.toBeVisible()

      // Tab to the context menu, press enter once to open it
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', {name: 'Open menu'})).toBeFocused()
      await page.waitForTimeout(200) // Confirm with @skogsmaskin if there is a better way
      await page.keyboard.press('Enter')
      await expect($locatorContextMenu).toBeVisible()
      await expect($locatorContextMenu.locator('*:focus', {hasText: 'Edit'})).toBeFocused()

      // We add delay to avoid flakyness
      await page.keyboard.press('ArrowDown')

      // Check that the correct menu item is focused
      await expect($locatorContextMenu.locator('*:focus', {hasText: 'Remove'})).toBeFocused()

      await page.keyboard.press('Enter')

      // Assertion: Block should now be deleted
      await expect($portableTextField.getByTestId('pte-block-object')).not.toBeVisible()
    })

    test('Handle focus correctly in block edit dialog', async ({page, mount}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($pte.locator('.pt-block.pt-object-block')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      const $dialog = page.getByTestId('default-edit-object-dialog')
      await expect($dialog).toBeVisible()

      // Assertion: Expect close button to be focused
      const $closeButton = $dialog.locator('button[aria-label="Close dialog"]:focus')
      const $closeButtonSvg = $dialog.locator('svg[data-sanity-icon="close"]:focus')
      await expect($closeButton.or($closeButtonSvg).first()).toBeFocused()

      // Tab to the input
      await page.keyboard.press('Tab')

      const $dialogInput = await page.getByTestId('default-edit-object-dialog').locator('input')

      // Assertion: Dialog should not be closed when you tab to input
      await expect($dialog).not.toBeHidden()

      // Check that we have focus on the input
      await expect($dialogInput).toBeFocused()

      // Assertion: Focus should be locked
      await page.keyboard.press('Tab+Tab')
      await expect($dialogInput).toBeFocused()
    })

    test('Blocks that appear in the menu bar should always display a title', async ({
      page,
      mount,
    }) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')
      await expect(
        $portableTextInput.getByRole('button').filter({hasText: 'Object Without Title'}),
      ).toBeVisible()
    })
  })
})
