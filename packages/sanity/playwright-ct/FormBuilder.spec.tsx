import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'

import {FormBuilderStory} from './FormBuilderStory'

test.use({viewport: {width: 1000, height: 1000}})

const DEFAULT_TYPE_DELAY = 150

function testHelpers({page, component}: any) {
  return {
    type: async (input: string, delay?: number) =>
      page.keyboard.type(input, {delay: delay || DEFAULT_TYPE_DELAY}),
    toggleShortcut: async (keys: string, callback: () => Promise<void>) => {
      await page.keyboard.press(keys, {delay: DEFAULT_TYPE_DELAY})
      // eslint-disable-next-line callback-return
      await callback()
      await page.keyboard.press(keys, {delay: DEFAULT_TYPE_DELAY})
    },
    press: async (input: string, delay?: number) =>
      page.keyboard.press(input, {delay: delay || DEFAULT_TYPE_DELAY}),
    toolbarButton: async (buttonLabel: string) =>
      component.getByRole('button').filter({hasText: buttonLabel}).press('Enter', {delay: 150}),
    toolbarButtonWithSelector: async (locator: string, delay?: number) =>
      component
        .getByRole('button')
        .filter({has: page.locator(locator)})
        .press('Enter', {delay: delay || DEFAULT_TYPE_DELAY}),
    goToPTE: async () => {
      // We wait for rendering of string inputs
      await expect(
        page.getByTestId('field-title').getByTestId('string-input').first()
      ).toBeVisible()
      await expect(
        component.getByTestId('field-title').getByTestId('string-input').first()
      ).toBeFocused()

      // Wait for rendering of PTE
      await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeVisible()

      // Tab over the required field, down to the PTE input.
      await page.keyboard.press('Tab+Tab', {delay: 200})

      await expect(component.locator('[data-testid="field-body"] :focus')).toBeFocused()

      // Textbox should now be focused so we can active PTE
      await expect(
        component.getByTestId('field-body').locator(':focus', {hasText: 'to activate'})
      ).toBeFocused()

      // Activate the input so we can type in it
      await page.keyboard.press('Space', {delay: 150})

      // Textbox should now be focused so we can type
      await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeFocused()
    },
  }
}

// Reference issues: https://github.com/microsoft/playwright/issues?page=2&q=is%3Aopen+label%3Afeature-components+sort%3Aupdated-desc

test.describe('PTE basic functionality', () => {
  test.skip(
    ({browserName}) => browserName === 'webkit',
    'Currently failing on Webkit/Safari due to different focus behaviour on activation'
  )

  test('default decorators should work', async ({mount, page}) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {type, press, goToPTE, toggleShortcut} = testHelpers({page, component})

    await expect(component).toBeVisible()

    await goToPTE()

    await toggleShortcut('Meta+b', async () => {
      await type('this should be bolded.')
    })
    await press('Enter')

    // await press('Meta+b')
    // await type('this should be bolded.')
    // await press('Meta+b')

    await expect(
      component
        .getByRole('textbox')
        .locator('[data-mark="strong"]', {hasText: 'this should be bolded'})
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
      component
        .getByRole('textbox')
        .locator('[data-mark="em"]', {hasText: 'this should be emphasised'})
    ).toBeVisible()

    // await expect(
    //     component.getByRole('textbox').getByText('this should be emphasised')
    //   ).toBeVisible()

    // await press('Meta+i')
    // await type('this should be emphasised.')
    // await press('Meta+i')
    // await press('Enter')

    // Underline text
    await toggleShortcut('Meta+u', async () => {
      await type('this should be underlined.')
    })
    await press('Enter')

    await expect(
      component
        .getByRole('textbox')
        .locator('[data-mark="underline"]', {hasText: 'this should be underlined'})
    ).toBeVisible()

    // await expect(
    //   component.getByRole('textbox').getByText('this should be underlined')
    // ).toBeVisible()

    // Code text
    await toggleShortcut(`Meta+'`, async () => {
      await type('this should be code.')
    })
    await press('Enter')

    await expect(
      component.getByRole('textbox').locator('[data-mark="code"]', {hasText: 'this should be code'})
    ).toBeVisible()
    // await expect(component.getByRole('textbox').getByText('this should be code')).toBeVisible()

    // @todo Test if using the keyboard shortcut for Emphasis or Bold works if you haven't typed anything yet will highlight it in the toolbar - this should currently fail
  })

  test('default and custom annotations should work', async ({mount, page}) => {
    let rerenders = 0

    const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

    const {type, press, goToPTE, toolbarButtonWithSelector} = testHelpers({
      page,
      component,
    })

    await expect(component).toBeVisible()

    await goToPTE()

    await type('Now we should insert a link.')
    await expect(
      component
        .getByRole('textbox')
        .locator('[data-slate-string="true"]', {hasText: 'Now we should insert a link.'})
    ).toBeVisible()
    // Wait for the text to be rendered

    // Backtrack
    await press('ArrowLeft')
    await press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await toolbarButtonWithSelector('[data-sanity-icon="link"]', 250)

    // Wait for link to be re-rendered / PTE internal state to be done
    await expect(
      component.getByRole('textbox').locator('[data-slate-node="text"] span[data-link]')
    ).toBeVisible()

    // Now we check if the edit popover shows automatically
    await expect(page.getByLabel('Url').first()).toBeAttached({
      timeout: 10000,
    })

    await page.getByLabel('Url').first().focus()

    await expect(page.getByLabel('Url').first()).toBeFocused()

    await type('https://www.sanity.io')
    await press('Escape')

    // await expect(
    //   component
    //     .locator('div')
    //     .filter({hasText: /^Edit Link$/})
    //     .first()
    // ).toBeAttached({
    //   timeout: 10000,
    // })
    // Then we focus input since this isn't automatically happening
  })

  //   test('should run all the expected basic PTE functionality', async ({mount, page}) => {
  //     let rerenders = 0

  //     const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)

  //     const {type, goToPTE} = testHelpers({page, component})

  //     await expect(component).toBeVisible()

  //     await goToPTE()

  //     // // We wait for rendering of string inputs
  //     // await expect(page.getByTestId('field-title').getByTestId('string-input').first()).toBeVisible()
  //     // await expect(
  //     //   component.getByTestId('field-title').getByTestId('string-input').first()
  //     // ).toBeFocused()

  //     // // Wait for rendering of PTE
  //     // await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeVisible()

  //     // // Tab over the required field, down to the PTE input.
  //     // await page.keyboard.press('Tab+Tab', {delay: 200})

  //     // await expect(component.locator('[data-testid="field-body"] :focus')).toBeFocused()

  //     // // Textbox should now be focused so we can active PTE
  //     // await expect(
  //     //   component.getByTestId('field-body').locator(':focus', {hasText: 'to activate'})
  //     // ).toBeFocused()

  //     // // Activate the input so we can type in it
  //     // await page.keyboard.press('Space', {delay: 150})

  //     // // Textbox should now be focused so we can type
  //     // await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeFocused()

  //     // Type a random sentence
  //     await type('hello world')

  //     // Now we will test that basic formatting works
  //     await page.keyboard.press('Shift+ArrowRight+ArrowRight+ArrowRight', {delay: 150})
  //     await page.keyboard.press('Meta+b', {delay: 150})
  //     await type(' this should be bolded.')

  //     // await component.getByRole('button')

  //     // Now we wait for the text to be output and render pass to finish
  //     // Note: This is important because the component / PTE won't have the correct state without waiting
  //     // and the next steps related to dialogs will end up flaky.
  //     await expect(component.getByRole('textbox').getByText('this should be bolded')).toBeVisible()

  //     // Insert Object into PTE - should trigger dialog to open
  //     await component.getByRole('button').filter({hasText: 'Object'}).press('Enter', {delay: 150})

  //     await expect(component.getByRole('textbox').getByText('this should be bolded')).toBeVisible()

  //     // Wait for the object preview to show inside of PTE
  //     await page.waitForSelector('.pt-block.pt-object-block')

  //     // Assertion: Object preview should be visible
  //     await expect(component.getByRole('textbox').locator('.pt-block.pt-object-block')).toBeVisible()

  //     await component.getByTestId('default-edit-object-dialog')

  //     // await new Promise((r) => setTimeout(r, 1000))

  //     await page.waitForSelector('[data-testid="default-edit-object-dialog"]')

  //     // await component.getByTestId('default-edit-object-dialog').waitFor()

  //     await page.keyboard.press('Tab', {delay: 150})

  //     // await page.waitForSelector('[data-testid="default-edit-object-dialog"]')

  //     // Now we await the input inside the dialog to be rendered
  //     await page.waitForSelector('[data-testid="default-edit-object-dialog"] input')

  //     // Check that we have focus on the input
  //     await expect(page.locator('[data-testid="default-edit-object-dialog"] input')).toBeFocused()

  //     const TEXT_DIALOG_TITLE_INPUT = `it works to type into the dialog title input`

  //     // Close dialog
  //     await page.keyboard.press('Escape', {delay: 150})

  //     // Dialog should now be gone
  //     await expect(component.getByTestId('default-edit-object-dialog')).toBeHidden()

  //     // Insert a ghost Enter to trigger render pass?
  //     await page.keyboard.press('Enter+Enter', {delay: 150})
  //     await page.keyboard.type('We now enter a new line', {delay: 150})

  //     // The object preview should now show the text we typed into the dialog title input
  //     // Disabled for now, since the preview store only uses document store behind the scenes and won't update
  //     // based on the hardcoded document value we use
  //     // await expect(component.locator('.pt-block.pt-object-block')).toHaveText(TEXT_DIALOG_TITLE_INPUT)
  //     await expect(component.locator('.pt-block.pt-object-block')).toHaveText('Untitled')

  //     // // await component.update(component.)

  //     // // await page.mouse.move(10, 10)

  //     // // const editModal = await component.getByTestId('default-edit-object-dialog')

  //     // // await page.mouse.move(10, 10)
  //     // // await page.mouse.move(200, 200)

  //     // // await editModal.waitFor({timeout: 10000})
  //     // // await editModal.waitFor({timeout: 20000})

  //     // // await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeFocused()
  //     // // await editModal.locator('input').focus()

  //     // await expect(component.locator('.pt-block.pt-object-block')).toBeVisible()

  //     // // // Close dialog
  //     // // await page.keyboard.press('Escape', {delay: 150})

  //     // // Now we try opening the edit modal by the edit button
  //     // await component.locator('.pt-block.pt-object-block button').click()

  //     // console.log('rerenders', rerenders)

  //     // // Find the edit button after the menu is opened
  //     // // await component.getByRole('button').filter({hasText: 'Edit'}).hover()
  //     // await component.getByRole('button').filter({hasText: 'Edit'}).press('Enter', {delay: 150})

  //     // // await component.getByTestId('default-edit-object-dialog').focus()
  //     // // await editModal.getByTestId('string-input').focus()
  //     // await expect(component.getByTestId('string-input')).toBeVisible()

  //     // await component.getByTestId('default-edit-object-dialog').focus()

  //     // await t)

  //     // // await expect(editModal).toBeVisible({})

  //     // // await typ)
  //     // await t)
  //     // .filter({hasText: 'Close'})
  //     // .type('Enter')

  //     /*
  //       - **Blocks**
  //           - [x]  Clicking a block link in the menu create a new block element
  //               - [ ]  Double-clicking opens the block
  //               - [ ]  The block context menu should be focusable
  //                   - [ ]  Clicking ‘edit’ should open the block
  //                   - [ ]  Clicking ‘delete’ should delete the block
  //               - [ ]  Custom block elements renders correctly
  //           - [ ]  In an open block Dialog
  //               - [ ]  Pressing tab should focus the first element (close button)
  //               - [ ]  Pressing tab should not close the dialog
  //               - [ ]  It should not be possible to focus elements outside the dialog (focus lock)
  //               - [ ]  Reference inputs
  //                   - [ ]  Nested reference AutoComplete popovers should be correctly constrained within the PTE’s Dialog boundary
  //                   - [ ]  Reference input renders correctly and is possible to access (via click + kb)
  //           - [ ]  Custom Inline blocks API?
  //       - **Annotations**
  //           - [ ]  Select text and create an inline annotation [object] (via the menu)
  //               - [x]  All default inline annotations should be rendered
  //               - [ ]  Custom inline annotations should be rendered
  //               - [ ]  Link annotation
  //                   - [ ]  Link annotation popover renders correctly
  //               - [ ]  It should be possible to open the annotation (via click + kb enter)
  //                   - [ ]  [Focus] Pressing tab should focus the first element (close button)
  //                   - [ ]  [Focus] Pressing tab should not close the popover
  //                   - [ ]  [Positioning] The popover should be positioned correctly
  //       - **Menu Bar**
  //           - [ ]  Block styles should not be visible if there is only 1 style
  //           - [ ]  Overflowing block links should appear in the “Add” menu button
  //           - [ ]  Blocks that appear in the menu bar should always display a title
  //         */
  //   })
})
