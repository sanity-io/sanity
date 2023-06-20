import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'

import {FormBuilderStory} from './FormBuilderStory'

test.use({viewport: {width: 500, height: 500}})

// Reference issues: https://github.com/microsoft/playwright/issues?page=2&q=is%3Aopen+label%3Afeature-components+sort%3Aupdated-desc

test('should run all the expected basic PTE functionality', async ({mount, page}) => {
  let rerenders = 0

  const component = await mount(<FormBuilderStory onRender={() => (rerenders += 1)} />)
  await expect(component).toBeVisible()

  await expect(page.getByTestId('string-input')).toBeVisible()
  await expect(component.getByTestId('string-input')).toBeFocused()

  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')

  await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeFocused()

  await page.keyboard.type('hello world')

  await page.keyboard.press('Shift+ArrowRight+ArrowRight+ArrowRight')
  await page.keyboard.press('Meta+b')
  await page.keyboard.type(' bleh')

  // await component.getByRole('button')

  // Insert Object into PTE - should trigger dialog
  await component.getByRole('button').filter({hasText: 'Object'}).press('Enter')

  await component.getByTestId('default-edit-object-dialog')

  await new Promise((r) => setTimeout(r, 1000))

  await page.waitForSelector('.pt-block.pt-object-block')

  await page.waitForSelector('[data-testid="default-edit-object-dialog"]')

  // await component.getByTestId('default-edit-object-dialog').waitFor()

  await page.keyboard.press('Tab')

  const id = await page.evaluate(() => document.activeElement?.id)

  console.log(id)

  // await page.waitForSelector('[data-testid="default-edit-object-dialog"]')

  await page.waitForSelector('[data-testid="default-edit-object-dialog"] input')

  await expect(page.locator('[data-testid="default-edit-object-dialog"] input')).toBeFocused()

  await page.keyboard.type('it works!!!!!!!!!')

  // Close dialog
  // await page.keyboard.press('Escape')

  // // await component.update(component.)

  // // await page.mouse.move(10, 10)

  // // const editModal = await component.getByTestId('default-edit-object-dialog')

  // // await page.mouse.move(10, 10)
  // // await page.mouse.move(200, 200)

  // // await editModal.waitFor({timeout: 10000})
  // // await editModal.waitFor({timeout: 20000})

  // // await expect(component.getByRole('textbox').filter({hasText: 'Empty'})).toBeFocused()
  // // await editModal.locator('input').focus()

  // await expect(component.locator('.pt-block.pt-object-block')).toBeVisible()

  // // // Close dialog
  // // await page.keyboard.press('Escape')

  // // Now we try opening the edit modal by the edit button
  // await component.locator('.pt-block.pt-object-block button').click()

  // console.log('rerenders', rerenders)

  // // Find the edit button after the menu is opened
  // // await component.getByRole('button').filter({hasText: 'Edit'}).hover()
  // await component.getByRole('button').filter({hasText: 'Edit'}).press('Enter')

  // // await component.getByTestId('default-edit-object-dialog').focus()
  // // await editModal.getByTestId('string-input').focus()
  // await expect(component.getByTestId('string-input')).toBeVisible()

  // await component.getByTestId('default-edit-object-dialog').focus()

  // await page.keyboard.type('helloworld')

  // // await expect(editModal).toBeVisible({})

  // // await page.keyboard.type('hello world')
  // await page.keyboard.type('helloworld')
  // .filter({hasText: 'Close'})
  // .type('Enter')

  /*
- **Blocks**
    - [ ]  Clicking a block link in the menu create a new block element
        - [ ]  Double-clicking opens the block
        - [ ]  The block context menu should be focusable
            - [ ]  Clicking ‘edit’ should open the block
            - [ ]  Clicking ‘delete’ should delete the block
        - [ ]  Custom block elements renders correctly
    - [ ]  In an open block Dialog
        - [ ]  Pressing tab should focus the first element (close button)
        - [ ]  Pressing tab should not close the dialog
        - [ ]  It should not be possible to focus elements outside the dialog (focus lock)
        - [ ]  Reference inputs
            - [ ]  Nested reference AutoComplete popovers should be correctly constrained within the PTE’s Dialog boundary
            - [ ]  Reference input renders correctly and is possible to access (via click + kb)
    - [ ]  Custom Inline blocks API?
- **Annotations**
    - [ ]  Select text and create an inline annotation [object] (via the menu)
        - [ ]  All default inline annotations should be rendered
        - [ ]  Custom inline annotations should be rendered
        - [ ]  Link annotation
            - [ ]  Link annotation popover renders correctly
        - [ ]  It should be possible to open the annotation (via click + kb enter)
            - [ ]  [Focus] Pressing tab should focus the first element (close button)
            - [ ]  [Focus] Pressing tab should not close the popover
            - [ ]  [Positioning] The popover should be positioned correctly
- **Menu Bar**
    - [ ]  Block styles should not be visible if there is only 1 style
    - [ ]  Overflowing block links should appear in the “Add” menu button
    - [ ]  Blocks that appear in the menu bar should always display a title
  */
})
