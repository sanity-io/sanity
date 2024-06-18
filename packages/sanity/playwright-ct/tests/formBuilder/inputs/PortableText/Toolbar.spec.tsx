/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'

import {testHelpers} from '../../../utils/testHelpers'
import {ToolbarStory} from './ToolbarStory'

test.describe('Portable Text Input', () => {
  test.describe('Toolbar', () => {
    test.use({viewport: {width: 1200, height: 1000}})

    test.describe('Adaptive size', () => {
      test('Overflow links should appear in the "Add" context menu', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        // Adjust the viewport size to make the Inline Object button hidden
        await page.setViewportSize({width: 800, height: 1000})

        const $contextMenuButton = $portableTextInput.getByTestId('insert-menu-button')

        // Assertion: Check if the context menu button is showing
        await expect($contextMenuButton).toBeVisible()

        // Assertion: Check if the Inline Object button is now hidden
        await expect(
          $portableTextInput.getByRole('button').filter({hasText: 'Inline Object'}),
        ).toBeHidden()

        await $contextMenuButton.click()

        // Assertion: Overflowing block link should appear in the “Add” menu button
        await expect(
          page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]'),
        ).toContainText('Inline Object')
      })
    })

    test.describe('Collapsible toolbar', () => {
      test.describe('Root <FormBuilder>', () => {
        test('Toolbar should collapse when element width is less than 400px', async ({
          mount,
          page,
        }) => {
          const {getFocusedPortableTextInput} = testHelpers({page})
          await mount(<ToolbarStory id="root" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          // Adjust viewport size to enable auto collapsing toolbar menus
          await page.setViewportSize({width: 450, height: 500})

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect($actionMenuAutoCollapseMenu).toBeVisible()
          await expect($insertMenuAutoCollapseMenu).toBeVisible()

          // Adjust viewport size to disable auto collapsing toolbar menus
          await page.setViewportSize({width: 350, height: 500})

          // Assertion: all auto collapsing menu buttons should be hidden
          await expect($actionMenuAutoCollapseMenu).toBeHidden()
          await expect($insertMenuAutoCollapseMenu).toBeHidden()
        })
      })
      test.describe('Non-root <FormBuilder>', () => {
        test('Toolbar should not collapse when element width is less than 400px', async ({
          mount,
          page,
        }) => {
          const {getFocusedPortableTextInput} = testHelpers({page})
          await mount(<ToolbarStory id="inspector-panel" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          await page.setViewportSize({width: 350, height: 500})

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect($actionMenuAutoCollapseMenu).toBeVisible()
          await expect($insertMenuAutoCollapseMenu).toBeVisible()
        })
      })
    })

    test.describe('Hidden toolbar', () => {
      test('Toolbar should be hidden after activation', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory ptInputProps={{hideToolbar: true}} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')
        // Assertion: the toolbar should not be rendered in the DOM
        await expect($toolbarCard).not.toBeAttached()
      })
    })

    test.describe('Opening block style', () => {
      test('on a simple editor', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect($toolbarCard).toBeVisible()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible
        await expect(page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
      })

      test('on a full screen simple editor', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabel('Expand editor').click()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible
        await expect(page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
      })

      test('on a full screen multi nested PTE', async ({mount, page}) => {
        const {getFocusedPortableTextInput} = testHelpers({page})
        await mount(<ToolbarStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabel('Expand editor').click()

        // prepare the nested PTE
        await page.getByRole('button', {name: 'Insert Nested (block)'}).click()

        await expect(
          page
            .locator('div')
            .filter({hasText: /^Edit Nested$/})
            .first(),
        ).toBeVisible()
        await page.getByTestId('add-single-object-button').click()

        // nested PTE object item
        await expect(
          page
            .locator('div')
            .filter({hasText: /^Edit Item$/})
            .first(),
        ).toBeVisible()

        // get the nested PTE
        const $overlay = await page.getByTestId('activate-overlay')

        $overlay.focus()
        $overlay.click()

        // click the block

        await expect(await page.getByTestId('pt-editor__toolbar-card')).toBeVisible()

        // click the nested PTE expand
        await page.getByLabel('Expand editor').nth(1).click()

        // click the block style select
        await page.getByTestId('block-style-select').nth(1).click()

        // Assertion: block style dropdown should be visible
        await expect(page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
      })
    })
  })
})
