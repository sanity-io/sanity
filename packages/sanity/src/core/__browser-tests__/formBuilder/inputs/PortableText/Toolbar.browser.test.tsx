/* eslint-disable max-nested-callbacks */
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {ToolbarStory} from './ToolbarStory'

describe('Portable Text Input', () => {
  describe('Toolbar', () => {
    describe('Adaptive size', () => {
      // TODO: viewport resize not available in Vitest browser mode
      it.skip('Overflow links should appear in the "Add" context menu', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        // Adjust the viewport size to make the Inline Object button hidden
        // TODO: viewport resize not available in Vitest browser mode

        const $contextMenuButton = $portableTextInput.getByTestId('insert-menu-button')

        // Assertion: Check if the context menu button is showing
        await expect.element($contextMenuButton).toBeVisible()

        // Assertion: Check if the Inline Object button is now hidden
        await expect
          .element(page.getByRole('button', {name: 'Inline Object'}))
          .not.toBeVisible()

        await $contextMenuButton.click()

        // Assertion: Overflowing block link should appear in the "Add" menu button
        const menuPopover = document.querySelector(
          '[data-ui="MenuButton__popover"] [data-ui="Menu"]',
        )
        expect(menuPopover?.textContent).toContain('Inline Object')
      })
    })

    describe('Collapsible toolbar', () => {
      describe('Root <FormBuilder>', () => {
        // TODO: viewport resize not available in Vitest browser mode
        it.skip('Toolbar should collapse when element width is less than 400px', async () => {
          const {getFocusedPortableTextInput} = testHelpers()
          render(<ToolbarStory id="root" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          // Adjust viewport size to enable auto collapsing toolbar menus
          // TODO: viewport resize not available in Vitest browser mode

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect.element($actionMenuAutoCollapseMenu).toBeVisible()
          await expect.element($insertMenuAutoCollapseMenu).toBeVisible()

          // Adjust viewport size to disable auto collapsing toolbar menus
          // TODO: viewport resize not available in Vitest browser mode

          // Assertion: all auto collapsing menu buttons should be hidden
          await expect.element($actionMenuAutoCollapseMenu).not.toBeVisible()
          await expect.element($insertMenuAutoCollapseMenu).not.toBeVisible()
        })
      })
      describe('Non-root <FormBuilder>', () => {
        // TODO: viewport resize not available in Vitest browser mode
        it.skip('Toolbar should not collapse when element width is less than 400px', async () => {
          const {getFocusedPortableTextInput} = testHelpers()
          render(<ToolbarStory id="inspector-panel" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          // TODO: viewport resize not available in Vitest browser mode

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect.element($actionMenuAutoCollapseMenu).toBeVisible()
          await expect.element($insertMenuAutoCollapseMenu).toBeVisible()
        })
      })
    })

    describe('Hidden toolbar', () => {
      it('Toolbar should be hidden after activation', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<ToolbarStory ptInputProps={{hideToolbar: true}} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')
        // Assertion: the toolbar should not be rendered in the DOM
        await expect.element($toolbarCard).not.toBeInTheDocument()
      })
    })

    // TODO - needs rewrite to avoid flakiness
    describe('Opening block style', () => {
      it('on a simple editor', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible
        const menuPopover = document.querySelector('[data-ui="MenuButton__popover"]')
        expect(menuPopover).not.toBeNull()
      })

      it('on a full screen simple editor', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabelText('Expand editor').click()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible
        const menuPopover = document.querySelector('[data-ui="MenuButton__popover"]')
        expect(menuPopover).not.toBeNull()
      })

      it('on a full screen multi nested PTE', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabelText('Expand editor').click()

        // prepare the nested PTE
        await page.getByRole('button', {name: 'Insert Nested (block)'}).click()

        await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

        await page.getByTestId('add-single-object-button').click()

        // nested PTE object item
        const untitledButtons = page.getByRole('button', {name: 'Untitled'}).elements()
        expect(untitledButtons.length).toBeGreaterThanOrEqual(2)

        // get the nested PTE
        const $overlay = page.getByTestId('activate-overlay')

        await $overlay.element().focus()
        await $overlay.click()

        // click the block
        const toolbarCards = document.querySelectorAll('[data-testid="pt-editor__toolbar-card"]')
        expect(toolbarCards.length).toBeGreaterThanOrEqual(2)

        // click the nested PTE expand
        const expandButtons = document.querySelectorAll('[aria-label="Expand editor"]')
        if (expandButtons.length >= 2) {
          await userEvent.click(expandButtons[1] as HTMLElement)
        }

        // click the block style select
        const blockStyleSelects = document.querySelectorAll(
          '[data-testid="block-style-select"]',
        )
        if (blockStyleSelects.length >= 2) {
          await userEvent.click(blockStyleSelects[1] as HTMLElement)
        }

        // Assertion: block style dropdown should be visible
        const menuPopover = document.querySelector('[data-ui="MenuButton__popover"]')
        expect(menuPopover).not.toBeNull()
      })
    })
  })
})
