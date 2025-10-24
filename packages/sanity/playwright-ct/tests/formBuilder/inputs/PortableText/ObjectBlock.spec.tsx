import {expect, test} from '../../../fixtures'
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

    test('Inline object toolbars works as expected', async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      await mount(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()
      const $locatorDialog = page.getByTestId('nested-object-dialog')
      // Assertion: Object edit dialog should be visible
      await expect($locatorDialog).toBeVisible()
      await page.locator('[data-sanity-icon="close"]').click()
      // Wait for dialog to close and ensure inline object gets focus
      await expect($locatorDialog).not.toBeVisible()
      // Click on the inline preview to ensure it's selected
      await $pte.getByTestId('inline-preview').click()
      // Assertion: the annotation toolbar popover should be visible
      await expect(page.getByTestId('inline-object-toolbar-popover')).toBeVisible()
      // Use clicks instead of Tab navigation to avoid Chrome focus issues
      await page.getByTestId('edit-inline-object-button').click()
      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      await page.locator('[data-sanity-icon="close"]').click()
      // Wait for dialog to close
      await expect($locatorDialog).not.toBeVisible()
      // Click on the inline preview again to ensure it's selected
      await $pte.getByTestId('inline-preview').click()
      await expect(page.getByTestId('inline-object-toolbar-popover')).toBeVisible()
      await page.getByTestId('remove-inline-object-button').click()
      await expect(page.getByTestId('inline-object-toolbar-popover')).not.toBeVisible()
      await expect($pte).toBeFocused()
    })

    test('Double-clicking opens a block', async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($pte.locator('.pt-block.pt-object-block')).toBeVisible()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await page.keyboard.press('Escape')

      // Dialog should now be gone
      await expect(page.getByTestId('nested-object-dialog')).toBeHidden()

      // Test that we can open dialog by double clicking
      await $pte.getByTestId('pte-block-object').dblclick()

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
    })

    test('Blocks should be accessible via block context menu', async ({mount, page}) => {
      const {getFocusedPortableTextInput} = testHelpers({page})
      await mount(<ObjectBlockStory />)

      const $portableTextField = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect($portableTextField.locator('.pt-block.pt-object-block')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await page.keyboard.press('Escape')

      // Dialog should now be gone
      await expect(page.getByTestId('nested-object-dialog')).toBeHidden()

      // Tab to the context menu, press enter once to open it, then enter again to press 'edit'
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', {name: 'Open menu'})).toBeFocused()
      await page.keyboard.press('Enter')

      // Assertion: Context menu should be open
      const $locatorContextMenu = page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')
      await expect($locatorContextMenu.locator('*:focus', {hasText: 'Edit'})).toBeFocused()

      await page.keyboard.press('Enter')

      // Assertion: Object edit dialog should be visible
      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Close dialog
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

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
      const $dialog = page.getByTestId('nested-object-dialog')
      await expect($dialog).toBeVisible()

      // Assertions: PTE name should be focused (breadcrumbs)
      await expect(page.getByRole('button', {name: 'body'})).toBeFocused()

      // Focus the input directly (more reliable than tab navigation in tests)
      const $input = page.getByTestId('nested-object-dialog').locator('input')
      await $input.focus()

      // Assertion: Dialog should not be closed when you focus the input
      await expect(page.getByTestId('nested-object-dialog')).not.toBeHidden()

      // Check that we have focus on the input
      await expect($input).toBeFocused()
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
