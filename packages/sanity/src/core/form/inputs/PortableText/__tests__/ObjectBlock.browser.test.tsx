import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {ObjectBlockStory} from './ObjectBlockStory'

describe('Portable Text Input', () => {
  describe('Object blocks', () => {
    it('Clicking a block link in the menu create a new block element', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).first().click()

      // Assertion: Object preview should be visible
      await expect.element($portableTextInput.getByTestId('pte-block-object')).toBeVisible()
    })

    it('Custom block preview components renders correctly', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).first().click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('inline-preview')).toBeVisible()

      // Assertion: Text in custom preview component should show
      await expect.element(page.getByText('Custom preview block:')).toBeVisible()
    })

    it('Inline object toolbars works as expected after opening and closing the edit dialog', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).first().click()
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
      void render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).first().click()
      await userEvent.dblClick(page.getByText('Custom preview block: Click'))
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
    })

    it('Inline object toolbars works as expected when removing the object', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).first().click()

      // Insert opens the inline object edit dialog; close it so the floating toolbar can show.
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
      await page.getByTestId('close-popover-edit-dialog-button').click()
      await expect.element(page.getByTestId('popover-edit-dialog')).not.toBeInTheDocument()

      // Focus the inline object to surface the toolbar.
      await page.getByText('Custom preview block:').click()

      const $removeButton = page.getByTestId('remove-inline-object-button')
      await expect.element(page.getByTestId('inline-object-toolbar-popover')).toBeVisible()
      await expect.element($removeButton).toBeVisible()

      // The toolbar popover floats and continuously repositions in Firefox, so
      // Playwright's actionability checks are flaky. Click via the DOM node instead.
      await userEvent.click($removeButton.element())

      await expect
        .element(page.getByTestId('inline-object-toolbar-popover'))
        .not.toBeInTheDocument()
      await expect.element($pte).toHaveFocus()
    })

    it('Double-clicking opens a block', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).first().click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('pte-block-object')).toBeVisible()

      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await userEvent.keyboard('{Escape}')

      // Dialog should now be gone
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeInTheDocument()

      // Test that we can open dialog by double clicking
      await userEvent.dblClick(page.getByTestId('pte-block-object'))

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()
    })

    it('Blocks should be accessible via block context menu', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<ObjectBlockStory />)

      const $portableTextField = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).first().click()

      // Assertion: Object preview should be visible
      await expect.element(page.getByTestId('pte-block-object')).toBeVisible()

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // We close the dialog first so we can test that we can open it again by double clicking
      await userEvent.keyboard('{Escape}')

      // Dialog should now be gone
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeInTheDocument()

      // Open the block context menu and choose "Edit" by clicking directly,
      // rather than relying on Tab/focus order and menu auto-focus (which differ
      // across browsers, notably Firefox).
      await page.getByRole('button', {name: 'Open menu'}).click()

      const $menuEdit = page.getByRole('menu').getByText('Edit', {exact: true})
      await expect.element($menuEdit).toBeVisible()
      await $menuEdit.click()

      // Assertion: Object edit dialog should be visible
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      // Close dialog
      await userEvent.keyboard('{Escape}')
      await expect.element(page.getByTestId('nested-object-dialog')).not.toBeInTheDocument()

      // Reopen the context menu and delete the block. Click the controls
      // directly rather than relying on Tab/focus order, which differs across
      // browsers after the dialog closes.
      await page.getByRole('button', {name: 'Open menu'}).click()

      const $menu = page.getByRole('menu')
      await expect.element($menu.getByText('Remove', {exact: true})).toBeVisible()
      await $menu.getByText('Remove', {exact: true}).click()

      // Assertion: Block should now be deleted
      await expect.element(page.getByTestId('pte-block-object')).not.toBeInTheDocument()
    })

    it('Handle focus correctly in block edit dialog', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ObjectBlockStory />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await page.getByRole('button', {name: 'Insert Object (block)'}).first().click()

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
      void render(<ObjectBlockStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')
      await expect
        .element(page.getByRole('button', {name: 'Insert Object Without Title (block)'}))
        .toBeVisible()
    })

    it('editing an inline object field syncs to the document value', async () => {
      const {getFocusedPortableTextEditor, waitForDocumentState} = testHelpers()
      void render(<ObjectBlockStory />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      await page.getByRole('button', {name: 'Insert Inline Object (inline)'}).first().click()
      const $locatorDialog = page.getByTestId('popover-edit-dialog')
      // Assertion: the inline object edit dialog should be visible
      await expect.element($locatorDialog).toBeVisible()

      await $locatorDialog.getByRole('textbox').fill('Hello note')

      // Assertion: the edited field is reflected in the document value
      const documentState = await waitForDocumentState((state) => {
        const child = state?.body?.[0]?.children?.find(
          (member: {_type: string}) => member._type !== 'span',
        )
        return child?.title === 'Hello note'
      })
      const inlineObject = documentState.body[0].children.find(
        (member: {_type: string}) => member._type !== 'span',
      )
      expect(inlineObject.title).toEqual('Hello note')
    })
  })
})
