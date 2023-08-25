import Os from 'os'
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../utils/testHelpers'
import {PortableTextInputStory} from './PortableTextInputStory'

test.use({viewport: {width: 1200, height: 1000}})

test.beforeEach(({browserName}) => {
  test.skip(
    browserName === 'webkit' && Os.platform() === 'linux',
    "Skipping Webkit for Linux which currently isn't supported.",
  )
})

test.describe('Activation', () => {
  test(`Show call to action on focus`, async ({mount}) => {
    const component = await mount(<PortableTextInputStory />)
    const $pteLocator = component.getByTestId('field-body')
    const $activeOverlay = $pteLocator.getByTestId('activate-overlay')

    // Assertion: Show correct text on keyboard focus
    await $activeOverlay.focus()
    await expect($activeOverlay).toHaveText('Click or press space to activate')
  })

  test(`Show call to action on hover`, async ({mount}) => {
    const component = await mount(<PortableTextInputStory />)
    const $pteLocator = component.getByTestId('field-body')
    const $activeOverlay = $pteLocator.getByTestId('activate-overlay')

    // Assertion: Show correct text on pointer hover
    await $activeOverlay.hover()
    await expect($activeOverlay).toHaveText('Click to activate')
  })
})

test.describe('Decorators', () => {
  test('Render default styles with keyboard shortcuts', async ({mount, page}) => {
    const {getModifierKey, getFocusedPortableTextEditor, insertPortableText, toggleHotkey} =
      testHelpers({
        page,
      })
    await mount(<PortableTextInputStory />)
    const $pte = await getFocusedPortableTextEditor('field-body')
    const modifierKey = getModifierKey()

    // Bold
    await toggleHotkey('b', modifierKey)
    await insertPortableText('bold text 123', $pte)
    await toggleHotkey('b', modifierKey)
    await expect($pte.locator('[data-mark="strong"]', {hasText: 'bold text'})).toBeVisible()

    // Italic
    await toggleHotkey('i', modifierKey)
    await insertPortableText('italic text', $pte)
    await toggleHotkey('i', modifierKey)
    await expect($pte.locator('[data-mark="em"]', {hasText: 'italic text'})).toBeVisible()

    // Underline
    await toggleHotkey('u', modifierKey)
    await insertPortableText('underlined text', $pte)
    await toggleHotkey('u', modifierKey)
    await expect(
      $pte.locator('[data-mark="underline"]', {
        hasText: 'underlined text',
      }),
    ).toBeVisible()

    // Code
    await toggleHotkey("'", modifierKey)
    await insertPortableText('code text', $pte)
    await expect($pte.locator('[data-mark="code"]', {hasText: 'code text'})).toBeVisible()
    await toggleHotkey("'", modifierKey)
  })

  test('Should not display block style button when no block styles are present', async ({
    mount,
    page,
  }) => {
    const {getFocusedPortableTextInput} = testHelpers({page})
    await mount(<PortableTextInputStory />)
    const $portableTextInput = await getFocusedPortableTextInput('field-bodyStyles')

    // Assertion: Block style button should be hidden
    await expect($portableTextInput.locator('button#block-style-select')).not.toBeVisible()
  })
})

test.describe('Annotations', () => {
  test('Create a new link with keyboard only', async ({mount, page}) => {
    const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({
      page,
    })
    await mount(<PortableTextInputStory />)
    const $pte = await getFocusedPortableTextEditor('field-body')

    await insertPortableText('Now we should insert a link.', $pte)

    // Backtrack and click link icon in menu bar
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await page
      .getByRole('button')
      .filter({has: page.locator('[data-sanity-icon="link"]')})
      .click()

    // Assertion: Wait for link to be re-rendered / PTE internal state to be done
    await expect($pte.locator('span[data-link]')).toBeVisible()

    // Now we check if the edit popover shows automatically
    await expect(page.getByLabel('Link').first()).toBeAttached({timeout: 10000})

    // Focus the URL input
    await page.getByLabel('Link').first().focus()

    // Assertion: The URL input should be focused
    await expect(page.getByLabel('Link').first()).toBeFocused()

    // Type in the URL
    await page.keyboard.type('https://www.sanity.io')

    // Close the popover
    await page.keyboard.press('Escape')

    // Expect the editor to have focus after closing the popover
    await expect($pte).toBeFocused()
  })
})

test.describe('Blocks', () => {
  test('Clicking a block link in the menu create a new block element', async ({mount, page}) => {
    const {getFocusedPortableTextInput} = testHelpers({page})
    await mount(<PortableTextInputStory />)

    const $portableTextInput = await getFocusedPortableTextInput('field-body')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      // @todo It seems like Firefox has different focus behaviour when using keypress here
      // causing the focus assertion to fail. The insert button will stay focused even after the dialog opens.
      // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
      .click()

    // Assertion: Object preview should be visible
    await expect($portableTextInput.locator('.pt-block.pt-object-block')).toBeVisible()
  })

  test('Custom block preview components renders correctly', async ({mount, page}) => {
    const {getFocusedPortableTextEditor} = testHelpers({page})
    await mount(<PortableTextInputStory />)
    const $pte = await getFocusedPortableTextEditor('field-body')

    await page
      .getByRole('button')
      .filter({hasText: /^Inline Object$/})
      // @todo It seems like Firefox has different focus behaviour when using keypress here
      // causing the focus assertion to fail. The insert button will stay focused even after the dialog opens.
      // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
      .click()

    // Assertion: Object preview should be visible
    await expect($pte.getByTestId('inline-preview')).toBeVisible()

    // Assertion: Text in custom preview component should show
    await expect($pte.getByText('Custom preview block:')).toBeVisible()
  })

  test('Double-clicking opens a block', async ({mount, page}) => {
    const {getFocusedPortableTextEditor} = testHelpers({page})
    await mount(<PortableTextInputStory />)

    const $pte = await getFocusedPortableTextEditor('field-body')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

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
    await mount(<PortableTextInputStory />)

    const $portableTextField = await getFocusedPortableTextInput('field-body')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

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
    await page.keyboard.press('Enter')

    // Assertion: Context menu should be open
    const $locatorContextMenu = page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')
    await expect($locatorContextMenu.locator('*:focus', {hasText: 'Edit'})).toBeFocused()

    await page.keyboard.press('Enter')

    // Assertion: Object edit dialog should be visible
    await expect(page.getByTestId('default-edit-object-dialog')).toBeVisible()

    // Close dialog
    await page.keyboard.press('Escape')

    // Tab to the context menu, press enter once to open it
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect($locatorContextMenu).toBeVisible()
    await expect($locatorContextMenu.locator('*:focus', {hasText: 'Edit'})).toBeFocused()

    // We add delay to avoid flakyness
    await page.keyboard.press('ArrowDown')

    // Check that the correct menu item is focused
    await expect($locatorContextMenu.locator('*:focus', {hasText: 'Delete'})).toBeFocused()

    await page.keyboard.press('Enter')

    // Assertion: Block should now be deleted
    await expect($portableTextField.getByTestId('pte-block-object')).not.toBeVisible()
  })

  test('Handle focus correctly in block edit dialog', async ({page, mount}) => {
    const {getFocusedPortableTextEditor} = testHelpers({page})
    await mount(<PortableTextInputStory />)

    const $pte = await getFocusedPortableTextEditor('field-body')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

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
})

test.describe('Menu bar', () => {
  test('Should display all default styles', async ({mount, page}) => {
    const {getFocusedPortableTextInput} = testHelpers({page})
    await mount(<PortableTextInputStory />)
    const $portableTextInput = await getFocusedPortableTextInput('field-bodyStyles')

    // Assertion: All icons in the menu bar should be visible
    const ICONS = ['bold', 'code', 'italic', 'link', 'olist', 'ulist', 'underline']
    for (const icon of ICONS) {
      await expect(
        $portableTextInput.getByRole('button').locator(`[data-sanity-icon="${icon}"]`),
      ).toBeVisible()
    }

    // Assertion: ???
    await expect($portableTextInput.locator('button#block-style-select')).not.toBeVisible()
  })

  test('Overflow links should appear in the "Add" context menu', async ({mount, page}) => {
    const {getFocusedPortableTextInput} = testHelpers({page})
    await mount(<PortableTextInputStory />)
    const $portableTextInput = await getFocusedPortableTextInput('field-body')

    // Adjust the viewport size to make the Inline Object button hidden
    await page.setViewportSize({width: 800, height: 1000})

    const $contextMenuButton = $portableTextInput
      .getByRole('button')
      .locator('[data-sanity-icon="add"]')

    // Assertion: Check if the Add + button is showing
    await expect($contextMenuButton).toBeVisible()

    // Assertion: Check if the Inline Object button is now hidden
    await expect(
      $portableTextInput.getByRole('button').filter({hasText: 'Inline Object'}),
    ).toBeHidden()

    await $contextMenuButton.click()

    // Assertion: Overflowing block link should appear in the “Add” menu button
    await expect(page.locator('[data-ui="MenuButton__popover"] [data-ui="Menu"]')).toContainText(
      'Inline Object',
    )
  })

  test('Blocks that appear in the menu bar should always display a title', async ({
    page,
    mount,
  }) => {
    const {getFocusedPortableTextInput} = testHelpers({page})
    await mount(<PortableTextInputStory />)

    const $portableTextInput = await getFocusedPortableTextInput('field-body')
    await expect(
      $portableTextInput.getByRole('button').filter({hasText: 'Object Without Title'}),
    ).toBeVisible()
  })
})
