import {expect, test} from '@playwright/experimental-ct-react'
import {type SanityDocument} from '@sanity/types'

import {testHelpers} from '../../../utils/testHelpers'
import ImageArrayDragStory from './ImageArrayDragStory'

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'a',
      children: [{_type: 'span', _key: 'b', text: 'Test content'}],
      markDefs: [],
    },
  ],
}

test.describe('Portable Text Input - ImageArrayDrag', () => {
  test('Portable Text Input - Array Input of images dragging an image will not trigger range out of bounds (toast)', async ({
    mount,
    page,
  }) => {
    const {dragAndDrop, getFocusedPortableTextEditor} = testHelpers({page})

    // Mount the story component with the test document
    await mount(<ImageArrayDragStory document={document} focusPath={['body']} />)

    // Get the focused portable text editor
    const $pte = await getFocusedPortableTextEditor('field-body')

    // Wait for the text block to be editable
    await expect(
      $pte.locator('[data-testid="text-block__text"]:not([data-read-only="true"])'),
    ).toBeVisible()

    // Open the insert menu
    await page
      .getByTestId('insert-menu-auto-collapse-menu')
      .getByRole('button', {name: 'Insert Image slideshow (block)'})
      .click()

    await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

    // Close the dialog to create an empty image slideshow block
    await page.getByRole('button', {name: 'Close dialog'}).click()

    await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

    // Wait for the block object to be rendered
    await expect(page.getByTestId('pte-block-object')).toBeVisible()

    // Now we should have an image slideshow block that we can try to drag
    // Let's try to drag it to a different position using the proper draggable element
    await dragAndDrop('.pt-editable [draggable="true"]', '[data-testid="text-block"]')

    // Check that the error toast is not visible
    // The specific error we're testing for: "Failed to execute 'getRangeAt' on 'Selection': 0 is not a valid index."
    await expect(page.getByRole('alert')).not.toBeVisible()

    // Alternative check - look for any error messages containing the specific text
    await expect(
      page.locator(
        ":has-text(\"Failed to execute 'getRangeAt' on 'Selection': 0 is not a valid index.\")",
      ),
    ).not.toBeVisible()
  })
})
