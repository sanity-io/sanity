import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'

import {FormBuilderStory} from './FormBuilderStory'
import {DEFAULT_TYPE_DELAY, setSessionStatus, setSessionTestName, testHelpers} from './testHelpers'

test.use({viewport: {width: 1200, height: 1000}})

// Reference issues: https://github.com/microsoft/playwright/issues?page=2&q=is%3Aopen+label%3Afeature-components+sort%3Aupdated-desc

test.describe('PTE basic functionality', () => {
  test.beforeEach(async ({page, browserName}, testInfo) => {
    // await setSessionTestName(page, testInfo)

    test.skip(
      browserName === 'webkit' || testInfo.project.name.toLowerCase().includes('webkit'),
      'Currently failing on Webkit/Safari due to different focus behaviour on activation'
    )
  })
  test.afterEach(async ({page}, testInfo) => {
    // await setSessionStatus(page, testInfo)
  })

  test('PTE: default decorators should work', async ({mount, page, browser}, testInfo) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {type, press, goToPTE, toggleShortcut} = testHelpers({page, component, testInfo})

    await expect(component).toBeVisible()

    await goToPTE()

    await toggleShortcut('Meta+b', async () => {
      await type('this should be bolded.')
    })
    await press('Enter')

    const $pteTextboxLocator = await page.getByTestId('field-body').getByRole('textbox')

    await expect(
      $pteTextboxLocator.locator('[data-mark="strong"]', {hasText: 'this should be bolded'})
    ).toBeVisible()

    // Emphasis
    await toggleShortcut('Meta+i', async () => {
      await type('this should be emphasised.')
    })
    await press('Enter')

    // Now we wait for the text to be output and render pass to finish
    // Note: This is important because the component / PTE won't have the correct state without waiting
    // and the next steps related to dialogs will end up flaky.
    await expect(
      $pteTextboxLocator.locator('[data-mark="em"]', {hasText: 'this should be emphasised'})
    ).toBeVisible()

    // Underline text
    await toggleShortcut('Meta+u', async () => {
      await type('this should be underlined.')
    })
    await press('Enter')

    await expect(
      $pteTextboxLocator.locator('[data-mark="underline"]', {hasText: 'this should be underlined'})
    ).toBeVisible()

    // Code text
    await toggleShortcut(`Meta+'`, async () => {
      await type('this should be code.')
    })
    await press('Enter')

    await expect(
      $pteTextboxLocator.locator('[data-mark="code"]', {hasText: 'this should be code'})
    ).toBeVisible()

    // @todo Test if using the keyboard shortcut for Emphasis or Bold works if you haven't typed anything yet will highlight it in the toolbar - this should currently fail
  })

  test('PTE: default and custom annotations should work', async ({mount, page}, testInfo) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {type, press, goToPTE, toolbarButtonWithSelector} = testHelpers({
      page,
      component,
      testInfo,
    })

    await expect(component).toBeVisible()

    await goToPTE()

    const $pteTextboxLocator = await page.getByTestId('field-body').getByRole('textbox')

    await type('Now we should insert a link.')
    await expect(
      $pteTextboxLocator.locator('[data-slate-string="true"]', {
        hasText: 'Now we should insert a link.',
      })
    ).toBeVisible()
    // Wait for the text to be rendered

    // Backtrack
    await press('ArrowLeft')
    await press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await toolbarButtonWithSelector('[data-sanity-icon="link"]', 250)

    // Wait for link to be re-rendered / PTE internal state to be done
    await expect(
      $pteTextboxLocator.locator('[data-slate-node="text"] span[data-link]')
    ).toBeVisible()

    // Now we check if the edit popover shows automatically
    await expect(page.getByLabel('Url').first()).toBeAttached({
      timeout: 10000,
    })

    await page.getByLabel('Url').first().focus()

    await expect(page.getByLabel('Url').first()).toBeFocused()

    await type('https://www.sanity.io')
    await press('Escape')
  })

  test('PTE: block styles', async ({mount, page}, testInfo) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {press, type, goToPTE} = testHelpers({page, component, testInfo})

    await expect(component).toBeVisible()

    await goToPTE()

    // Target the last PTE input on the page
    const $pteField = page.getByTestId('field-bodyStyles')
    const $pteTextboxLocator = page.getByTestId('field-bodyStyles').getByRole('textbox')

    // Tab down to the last PTE input.
    await page.keyboard.press('Tab+Tab+Tab+Tab', {delay: 200})

    // Assert: Strong style should be visible
    await expect($pteField.getByRole('button').locator('[data-sanity-icon="bold"]')).toBeVisible()

    await expect($pteField.locator('button#block-style-select')).not.toBeVisible()
  })

  test('PTE: blocks', async ({mount, page}, testInfo) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {press, type, goToPTE} = testHelpers({page, component, testInfo})

    await expect(component).toBeVisible()

    await goToPTE()

    // Now we wait for the text to be output and render pass to finish
    // Note: This is important because the component / PTE won't have the correct state without waiting
    // and the next steps related to dialogs will end up flaky.
    // await expect(page.getByRole('textbox').first().getByText('this should be bolded')).toBeVisible()

    // Insert Object into PTE - should trigger dialog to open
    await component
      .getByRole('button')
      .filter({hasText: /^Object$/})
      // @todo It seems like Firefox has different focus behaviour when using keypress here
      // causing the focus assertion to fail. The insert button will stay focus even after the dialog opens.
      // .press('Enter', {delay: DEFAULT_TYPE_DELAY})
      .click({delay: DEFAULT_TYPE_DELAY})

    // Assertion: Blocks that appear in the menu bar should always display a title
    await expect(page.getByRole('button').filter({hasText: 'Object Without Title'})).toBeVisible()

    // Wait for the object preview to show inside of PTE
    await page.waitForSelector('.pt-block.pt-object-block')

    const $pteField = page.getByTestId('field-body')
    const $pteTextboxLocator = $pteField.getByRole('textbox')

    // Assertion: Object preview should be visible
    await expect($pteTextboxLocator.locator('.pt-block.pt-object-block')).toBeVisible()

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
    await type(TEXT_DIALOG_TITLE_INPUT, 90)

    await expect($dialogInput).toHaveValue(TEXT_DIALOG_TITLE_INPUT)

    // Assertion: Focus should be locked
    await press('Tab+Tab')
    await expect($dialogInput).toBeFocused()

    // Close dialog
    await press('Escape')

    // Dialog should now be gone
    await expect(page.getByTestId('default-edit-object-dialog')).toBeHidden()

    // The object preview should now show the text we typed into the dialog title input
    // Disabled for now, since the preview store only uses document store behind the scenes and won't update
    // based on the hardcoded document value we use
    await expect(page.locator('.pt-block.pt-object-block')).toHaveText('Untitled')

    // Test that we can open dialog by double clicking
    await $pteTextboxLocator.getByTestId('pte-block-object').dblclick()

    await expect($dialog).toBeVisible()

    // Close dialog
    await press('Escape')

    // Open dialog by clicking on the object preview
    await press('Tab')
    await press('Enter')
    await press('Enter')

    // Assertion: Dialog should be open
    await expect($dialog).toBeVisible()

    // Close dialog
    await press('Escape')

    // Open context menu -> select Delete
    await press('Tab')
    await press('Enter')
    await press('ArrowDown')
    await press('Enter')

    // Assertion: Block should now be deleted
    await expect($pteTextboxLocator.getByTestId('pte-block-object')).not.toBeVisible()

    // Insert a ghost Enter to trigger render pass?
    await press('Enter+Enter')
    await page.keyboard.type('We now enter a new line', {delay: DEFAULT_TYPE_DELAY})

    // Assertion: Overflowing block links should appear in the “Add” menu button
    await expect($pteField.getByRole('button').filter({hasText: 'Inline Object'})).toBeVisible()

    await page.setViewportSize({width: 800, height: 1000})

    // Assertion: Check if the Inline Object button is now hidden
    await expect($pteField.getByRole('button').filter({hasText: 'Inline Object'})).toBeHidden()

    // Assertion: Check if the Add + button is showing
    await expect($pteField.getByRole('button').locator('[data-sanity-icon="add"]')).toBeVisible()
  })
})
