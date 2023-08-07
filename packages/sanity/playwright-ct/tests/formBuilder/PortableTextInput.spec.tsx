import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {DEFAULT_TYPE_DELAY, testHelpers} from '../utils/testHelpers'
import {PortableTextInputStory} from './PortableTextInputStory'

test.use({viewport: {width: 1200, height: 1000}})

test.beforeEach(({browserName}, testInfo) => {
  test.skip(
    browserName === 'webkit' || testInfo.project.name.toLowerCase().includes('webkit'),
    'Currently failing on Webkit/Safari due to different focus behaviour on activation of the PTE'
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
  test('Render default styles with keyboard shortcuts', async ({mount, page}, testInfo) => {
    const {getModifierKey, focusPTE, typeInPTEWithDelay} = testHelpers({
      page,
      testInfo,
    })
    await mount(<PortableTextInputStory />)
    const $pteField = await focusPTE('field-body')
    const $pteTextbox = $pteField.getByRole('textbox')

    // Bold
    await page.keyboard.press(`${getModifierKey()}+b`)
    await typeInPTEWithDelay('bold text 123', $pteTextbox)

    await page.keyboard.press(`${getModifierKey()}+b`, {delay: DEFAULT_TYPE_DELAY})
    await page.keyboard.press('Enter')

    await expect($pteTextbox.locator('[data-mark="strong"]', {hasText: 'bold text'})).toBeVisible()

    // Italic
    await page.keyboard.press(`${getModifierKey()}+i`, {delay: DEFAULT_TYPE_DELAY})
    await typeInPTEWithDelay('italic text', $pteTextbox)

    await page.keyboard.press(`${getModifierKey()}+i`)
    await page.keyboard.press('Enter')
    await expect($pteTextbox.locator('[data-mark="em"]', {hasText: 'italic text'})).toBeVisible()

    // Underline
    await page.keyboard.press(`${getModifierKey()}+u`)
    await typeInPTEWithDelay('underlined text', $pteTextbox)
    await page.keyboard.press(`${getModifierKey()}+u`)
    await page.keyboard.press('Enter')
    await expect(
      $pteTextbox.locator('[data-mark="underline"]', {
        hasText: 'underlined text',
      })
    ).toBeVisible()

    // Code
    await page.keyboard.press(`${getModifierKey()}+'`)
    await typeInPTEWithDelay('code text', $pteTextbox)
    await expect($pteTextbox.locator('[data-mark="code"]', {hasText: 'code text'})).toBeVisible()
    await page.keyboard.press(`${getModifierKey()}+'`)
    await page.keyboard.press('Enter')
  })
})

test.describe('Annotations', () => {
  test('Create a new link with keyboard only', async ({mount, page}, testInfo) => {
    const {focusPTE, typeWithDelay, typeInPTEWithDelay} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)
    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await typeInPTEWithDelay('Now we should insert a link.', $pteTextbox)

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
    await expect(page.getByLabel('Link').first()).toBeAttached({timeout: 10000})

    // Focus the URL input
    await page.getByLabel('Link').first().focus()

    // Assertion: The URL input should be focused
    await expect(page.getByLabel('Link').first()).toBeFocused()

    // Type in the URL
    await typeWithDelay('https://www.sanity.io')

    // Close the popover
    await page.keyboard.press('Escape')
  })
})

test.describe('Blocks', () => {
  test('Clicking a block link in the menu create a new block element', async ({
    mount,
    page,
  }, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      // @todo It seems like Firefox has different focus behaviour when using keypress here
      // causing the focus assertion to fail. The insert button will stay focused even after the dialog opens.
      // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
      .click()

    // Assertion: Object preview should be visible
    await expect($pteTextbox.locator('.pt-block.pt-object-block')).toBeVisible()
  })

  test('Custom block preview components renders correctly', async ({mount, page}, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await page
      .getByRole('button')
      .filter({hasText: /^Inline Object$/})
      // @todo It seems like Firefox has different focus behaviour when using keypress here
      // causing the focus assertion to fail. The insert button will stay focused even after the dialog opens.
      // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
      .click()

    // Assertion: Object preview should be visible
    await expect($pteTextbox.getByTestId('inline-preview')).toBeVisible()

    // Assertion: Text in custom preview component should show
    await expect($pteTextbox.getByText('Custom preview block:')).toBeVisible()
  })

  test('Double-clicking opens a block', async ({mount, page}, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

    // Assertion: Object preview should be visible
    await expect($pteTextbox.locator('.pt-block.pt-object-block')).toBeVisible()

    const $locatorDialog = page.getByTestId('default-edit-object-dialog')

    // Assertion: Object edit dialog should be visible
    await expect($locatorDialog).toBeVisible()

    // We close the dialog first so we can test that we can open it again by double clicking
    await page.keyboard.press('Escape')

    // Dialog should now be gone
    await expect($locatorDialog).toBeHidden()

    // Test that we can open dialog by double clicking
    await $pteTextbox.getByTestId('pte-block-object').dblclick()

    // Assertion: Object edit dialog should be visible
    await expect($locatorDialog).toBeVisible()
  })

  test('Blocks should be accessible via block context menu', async ({mount, page}, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

    // Assertion: Object preview should be visible
    await expect($pteTextbox.locator('.pt-block.pt-object-block')).toBeVisible()

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
    await expect($pteTextbox.getByTestId('pte-block-object')).not.toBeVisible()
  })

  test('Handle focus correctly in block edit dialog', async ({page, mount}, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')
    const $pteTextbox = await $pteField.getByRole('textbox')

    await page
      .getByRole('button')
      .filter({hasText: /^Object$/})
      .click()

    // Assertion: Object preview should be visible
    await expect($pteTextbox.locator('.pt-block.pt-object-block')).toBeVisible()

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
  test('Should display all default styles', async ({mount, page}, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)
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
    const $pteField = await mount(<PortableTextInputStory />)
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

  test('Blocks that appear in the menu bar should always display a title', async ({
    page,
    mount,
  }, testInfo) => {
    const {focusPTE} = testHelpers({page, testInfo})
    await mount(<PortableTextInputStory />)

    const $pteField = await focusPTE('field-body')

    await $pteField.getByRole('textbox')

    await expect(page.getByRole('button').filter({hasText: 'Object Without Title'})).toBeVisible()
  })
})
