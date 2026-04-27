import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {ObjectBlockStory} from './ObjectBlockStory'

describe('Portable Text Input', () => {
  describe('Object blocks', () => {
    it('Clicking a block link in the menu create a new block element', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      render(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect
        .element($portableTextInput.getByRole('article'))
        .toBeVisible()
    })

    it('Custom block preview components renders correctly', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('inline-preview')).toBeVisible()

      // Assertion: Text in custom preview component should show
      await expect.element(page.getByText('Custom preview block:')).toBeVisible()
    })

    it('Inline object toolbars works as expected after opening and closing the edit dialog', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()
      const $locatorDialog = page.getByTestId('popover-edit-dialog')
      // Assertion: Object edit dialog should be visible
      await expect.element($locatorDialog).toBeVisible()
      const closeButton = document.querySelector('[data-sanity-icon="close"]') as HTMLElement
      if (closeButton) await userEvent.click(closeButton)

      await page.getByText('Custom preview block:').click()
      // Assertion: the annotation toolbar popover should be visible
      await expect.element(page.getByTestId('inline-object-toolbar-popover')).toBeVisible()
    })

    it('Inline object works as expected when clicking the edit button', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()
      await userEvent.dblClick(page.getByText('Custom preview block: Click'))
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
    })

    it('Inline object toolbars works as expected when removing the object', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).click()

      // Assertion: the annotation toolbar popover should be visible
      await expect.element(page.getByTestId('inline-object-toolbar-popover')).toBeVisible()
      await expect.element(page.getByTestId('remove-inline-object-button')).toBeVisible()
      await page.getByTestId('remove-inline-object-button').click()
      await expect.element(page.getByTestId('inline-object-toolbar-popover')).not.toBeVisible()
      await expect.element($pte).toHaveFocus()
    })

    it('Double-clicking opens a block', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect
        .element(page.getByTestId('pte-block-object'))
        .toBeVisible()

      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await userEvent.keyboard('{Escape}')

      // Dialog should now be gone
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Test that we can open dialog by double clicking
      await userEvent.dblClick(page.getByTestId('pte-block-object'))

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()
    })

    it('Blocks should be accessible via block context menu', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      render(<ObjectBlockStory />)

      const $portableTextField = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('pte-block-object')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await userEvent.keyboard('{Escape}')

      // Dialog should now be gone
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Tab to the context menu, press enter once to open it, then enter again to press 'edit'
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByRole('button', {name: 'Open menu'})).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      // Assertion: Context menu should be open
      const $locatorContextMenu = document.querySelector(
        '[data-ui="MenuButton__popover"] [data-ui="Menu"]',
      )
      expect($locatorContextMenu).not.toBeNull()

      // Find the focused element with 'Edit' text
      const focusedEdit = $locatorContextMenu?.querySelector('*:focus')
      expect(focusedEdit?.textContent).toContain('Edit')

      await userEvent.keyboard('{Enter}')

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Close dialog
      await userEvent.keyboard('{Escape}')
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Tab to the context menu, press enter once to open it
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByRole('button', {name: 'Open menu'})).toHaveFocus()
      await new Promise((r) => setTimeout(r, 200)) // Confirm with @skogsmaskin if there is a better way
      await userEvent.keyboard('{Enter}')

      const $contextMenu2 = document.querySelector(
        '[data-ui="MenuButton__popover"] [data-ui="Menu"]',
      )
      expect($contextMenu2).not.toBeNull()

      const focusedEdit2 = $contextMenu2?.querySelector('*:focus')
      expect(focusedEdit2?.textContent).toContain('Edit')

      // We add delay to avoid flakyness
      await userEvent.keyboard('{ArrowDown}')

      // Check that the correct menu item is focused
      const focusedRemove = $contextMenu2?.querySelector('*:focus')
      expect(focusedRemove?.textContent).toContain('Remove')

      await userEvent.keyboard('{Enter}')

      // Assertion: Block should now be deleted
      await expect.element(page.getByTestId('pte-block-object')).not.toBeVisible()
    })

    it('Handle focus correctly in block edit dialog', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      render(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('pte-block-object')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      const $dialog = page.getByTestId('nested-object-dialog')
      await expect.element($dialog).toBeVisible()

      // Assertions: PTE name should be focused (breadcrumbs)
      await expect.element(page.getByRole('button', {name: 'body'})).toHaveFocus()

      // Focus the input directly (more reliable than tab navigation in tests)
      const $inputEl = document.querySelector(
        '[data-testid="nested-object-dialog"] input',
      ) as HTMLElement
      if ($inputEl) $inputEl.focus()

      // Assertion: Dialog should not be closed when you focus the input
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Check that we have focus on the input
      expect(document.activeElement).toBe($inputEl)
    })

    it('Blocks that appear in the menu bar should always display a title', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      render(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')
      await expect
        .element(page.getByRole('button', {name: 'Insert Object Without Title (block)'}))
        .toBeVisible()
    })
  })
})
