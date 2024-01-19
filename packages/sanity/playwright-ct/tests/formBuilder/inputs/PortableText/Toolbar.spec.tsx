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
  })
})
