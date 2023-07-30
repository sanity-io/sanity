import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {FormBuilderStory} from './FormBuilderStory'
import {DEFAULT_TYPE_DELAY, testHelpers} from './utils/testHelpers'

test.use({viewport: {width: 1200, height: 1000}})

/*
 * Some important notes
 * - Its important to await locator() calls to ensure the element is actually rendered after you do something, like waiting for a dialog to show up.
 *   Otherwise you might end up with flaky tests.
 * - The same goes for typing/keypresses. The default delay is 20ms, to emulate a human typing and to allow the PTE to render
 *   the text before we continue the test.
 * - Ideally we would use testid's for all elements, but the focus for these tests was to get working tests up and running
 * - Sometimes you probably will end up with arbritary selectors. In that case an idea is to have a SELECTORS object with all selectors
 *   and then use that in the tests. This way we can label the selectors to explain what they map to in the Sanity Studio.
 * - Running these tests in CI might take a relatively long time. We have tweaked the timeouts to be a bit more generous.
 *   If you run into issues with timeouts, adjusting timeouts in the playwright config and making sure selectors are correct is
 *   the two first things you should try.
 */

test.describe('Portable Text Editor', () => {
  test.beforeEach(async ({browserName}, testInfo) => {
    test.skip(
      browserName === 'webkit' || testInfo.project.name.toLowerCase().includes('webkit'),
      'Currently failing on Webkit/Safari due to different focus behaviour on activation of the PTE'
    )
  })

  test.describe('Activation', () => {
    test(`Show call to action on focus`, async ({mount}) => {
      const component = await mount(<FormBuilderStory />)
      const $pteLocator = component.getByTestId('field-body')
      const $activeOverlay = $pteLocator.getByTestId('activate-overlay')

      // Assertion: Show correct text on keyboard focus
      await $activeOverlay.focus()
      await expect($activeOverlay).toHaveText('Click or press space to activate')
    })

    test(`Show call to action on hover`, async ({mount}) => {
      const component = await mount(<FormBuilderStory />)
      const $pteLocator = component.getByTestId('field-body')
      const $activeOverlay = $pteLocator.getByTestId('activate-overlay')

      // Assertion: Show correct text on pointer hover
      await $activeOverlay.hover()
      await expect($activeOverlay).toHaveText('Click to activate')
    })
  })

  test.describe('Decorators', () => {
    // @todo Test if using the keyboard shortcut for Emphasis or Bold works if you haven't typed anything yet will highlight it in the toolbar - this should currently fail
    test('Render default styles with keyboard shortcuts', async ({mount, page}, testInfo) => {
      const {getModifierKey, focusPTE, typeWithDelay} = testHelpers({page, testInfo})
      await mount(<FormBuilderStory />)
      const $pteField = await focusPTE('field-body')
      const $pteTextbox = $pteField.getByRole('textbox')

      // Bold
      await page.keyboard.press(`${getModifierKey()}+b`)
      await typeWithDelay('bold text 123')
      await page.keyboard.press(`${getModifierKey()}+b`, {delay: 100})
      await page.keyboard.press('Enter')
      await expect(
        $pteTextbox.locator('[data-mark="strong"]', {hasText: 'bold text'})
      ).toBeVisible()

      // Italic
      await page.keyboard.press(`${getModifierKey()}+i`)
      await typeWithDelay('italic text')
      await page.keyboard.press(`${getModifierKey()}+i`)
      await page.keyboard.press('Enter')
      await expect($pteTextbox.locator('[data-mark="em"]', {hasText: 'italic text'})).toBeVisible()

      // Underline
      await page.keyboard.press(`${getModifierKey()}+u`)
      await typeWithDelay('underlined text')
      await page.keyboard.press(`${getModifierKey()}+u`)
      await page.keyboard.press('Enter')
      await expect(
        $pteTextbox.locator('[data-mark="underline"]', {
          hasText: 'underlined text',
        })
      ).toBeVisible()

      // Code
      await page.keyboard.press(`${getModifierKey()}+'`)
      await typeWithDelay('code text')
      await page.keyboard.press(`${getModifierKey()}+'`)
      await page.keyboard.press('Enter')
      await expect($pteTextbox.locator('[data-mark="code"]', {hasText: 'code text'})).toBeVisible()
    })
  })

  test.describe('Annotations', () => {
    test('Create a new link with keyboard only', async ({mount, page}, testInfo) => {
      const {focusPTE, typeWithDelay} = testHelpers({page, testInfo})
      await mount(<FormBuilderStory />)
      const $pteField = await focusPTE('field-body')
      const $pteTextbox = await $pteField.getByRole('textbox')

      await typeWithDelay('Now we should insert a link.')

      // Assertion: Wait for the text to be rendered
      await expect(
        $pteTextbox.locator('[data-slate-string="true"]', {
          hasText: 'Now we should insert a link.',
        })
      ).toBeVisible()

      // Backtrack and click link icon in menu bar
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
      await page
        .getByRole('button')
        .filter({has: page.locator('[data-sanity-icon="link"]')})
        .click()

      // Assertion: Wait for link to be re-rendered / PTE internal state to be done
      await expect($pteTextbox.locator('[data-slate-node="text"] span[data-link]')).toBeVisible()

      // Now we check if the edit popover shows automatically
      await expect(page.getByLabel('Url').first()).toBeAttached({timeout: 10000})

      // Focus the URL input
      await page.getByLabel('Url').first().focus()

      // Assertion: The URL input should be focused
      await expect(page.getByLabel('Url').first()).toBeFocused()

      // Type in the URL
      await typeWithDelay('https://www.sanity.io')

      // Close the popover
      await page.keyboard.press('Escape')
    })
  })

  test.describe('Blocks', () => {
    test('Megastory (should be split up)', async ({mount, page}, testInfo) => {
      const {focusPTE, typeWithDelay} = testHelpers({page, testInfo})
      const component = await mount(<FormBuilderStory />)
      const $pteField = await focusPTE('field-body')
      const $pteTextbox = await $pteField.getByRole('textbox')

      // Insert Object into PTE - should trigger dialog to open
      await component
        .getByRole('button')
        .filter({hasText: /^Object$/})
        // @todo It seems like Firefox has different focus behaviour when using keypress here
        // causing the focus assertion to fail. The insert button will stay focused even after the dialog opens.
        // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
        .click({delay: DEFAULT_TYPE_DELAY})

      // Assertion: Blocks that appear in the menu bar should always display a title
      await expect(page.getByRole('button').filter({hasText: 'Object Without Title'})).toBeVisible()

      // Wait for the object preview to show inside of PTE
      await page.waitForSelector('.pt-block.pt-object-block')

      // Assertion: Object preview should be visible
      await expect($pteTextbox.locator('.pt-block.pt-object-block')).toBeVisible()

      // Assertion: Object edit dialog should be visible should be visible
      const $dialog = page.getByTestId('default-edit-object-dialog')
      await expect(page.locator(':focus')).toBeFocused()
      await expect($dialog).toBeVisible()
      await expect($dialog.locator(':focus')).toBeFocused()

      // Assertion: Expect close button to be focused
      const $closeButton = $dialog.locator('button[aria-label="Close dialog"]:focus')
      const $closeButtonSvg = $dialog.locator('svg[data-sanity-icon="close"]:focus')
      await expect($closeButton.or($closeButtonSvg).first()).toBeFocused()

      // Tab to the input
      await page.keyboard.press('Tab', {delay: DEFAULT_TYPE_DELAY})

      // Assertion: Dialog should not be closed when you tab
      await expect($dialog).not.toBeHidden()

      const $dialogInput = await page.locator('[data-testid="default-edit-object-dialog"] input')

      // Check that we have focus on the input
      await expect($dialogInput).toBeFocused()

      const TEXT_DIALOG_TITLE_INPUT = `it works to type into the dialog title input`

      // Lets's type into the input
      await typeWithDelay(TEXT_DIALOG_TITLE_INPUT)

      await expect($dialogInput).toHaveValue(TEXT_DIALOG_TITLE_INPUT)

      // Assertion: Focus should be locked
      await page.keyboard.press('Tab+Tab')
      await expect($dialogInput).toBeFocused()

      // Close dialog
      await page.keyboard.press('Escape')

      // Dialog should now be gone
      await expect(page.getByTestId('default-edit-object-dialog')).toBeHidden()

      // The object preview should now show the text we typed into the dialog title input
      // Disabled for now, since the preview store only uses document store behind the scenes and won't update
      // based on the hardcoded document value we use
      await expect(page.locator('.pt-block.pt-object-block')).toHaveText('Untitled')

      // Test that we can open dialog by double clicking
      await $pteTextbox.getByTestId('pte-block-object').dblclick()

      await expect($dialog).toBeVisible()

      // Close dialog
      await page.keyboard.press('Escape')
      // Dialog should now be gone
      await expect(page.getByTestId('default-edit-object-dialog')).toBeHidden()

      // Open dialog: tab to the context menu, press enter once to open it, then enter again to press 'edit'
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Assertion: Context menu should be open
      // @todo: re-enable keyboard only navigation, understand why `press()` is flaky, even with visible assertions
      // await expect(page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')).toBeVisible()
      // await page.keyboard.press('Enter')
      await page
        .locator('[data-ui="MenuButton__popover"] [data-ui="Menu"] [data-ui="MenuItem"]')
        .nth(0)
        .click()

      // Assertion: Dialog should be open
      await expect($dialog).toBeVisible()

      // Close dialog
      await page.keyboard.press('Escape')

      // Open context menu -> select Delete
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      // @todo: re-enable keyboard only navigation, understand why `press()` is flaky, even with visible assertions
      // await page.keyboard.press('ArrowDown')
      // await page.keyboard.press('Enter')
      await page
        .locator('[data-ui="MenuButton__popover"] [data-ui="Menu"] [data-ui="MenuItem"]')
        .nth(1)
        .click()

      // Assertion: Block should now be deleted
      await expect($pteTextbox.getByTestId('pte-block-object')).not.toBeVisible()
    })
  })

  test.describe('Menu bar', () => {
    test('Should display all default styles', async ({mount, page}, testInfo) => {
      const {focusPTE} = testHelpers({page, testInfo})
      await mount(<FormBuilderStory />)
      const $pteField = await focusPTE('field-bodyStyles')

      // Assertion: All icons in the menu bar should be visible
      const ICONS = ['bold', 'code', 'italic', 'link', 'olist', 'ulist', 'underline']
      for (const icon of ICONS) {
        await expect(
          $pteField.getByRole('button').locator(`[data-sanity-icon="${icon}"]`)
        ).toBeVisible()
      }

      // Assertion: ???
      await expect($pteField.locator('button#block-style-select')).not.toBeVisible()
    })

    test('Overflow links should appear in the "Add" context menu', async ({
      mount,
      page,
    }, testInfo) => {
      const {focusPTE} = testHelpers({page, testInfo})
      const $pteField = await mount(<FormBuilderStory />)
      await focusPTE('field-body')

      // Adjust the viewport size to make the Inline Object button hidden
      await page.setViewportSize({width: 800, height: 1000})

      const $contextMenuButton = $pteField.getByRole('button').locator('[data-sanity-icon="add"]')

      // Assertion: Check if the Add + button is showing
      await expect($contextMenuButton).toBeVisible()

      // Assertion: Check if the Inline Object button is now hidden
      await expect($pteField.getByRole('button').filter({hasText: 'Inline Object'})).toBeHidden()

      await $contextMenuButton.click()

      // Assertion: Overflowing block link should appear in the “Add” menu button
      await expect(page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')).toContainText(
        'Inline Object'
      )
    })
  })
})
