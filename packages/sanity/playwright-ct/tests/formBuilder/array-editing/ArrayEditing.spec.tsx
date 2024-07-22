import {expect, test} from '@playwright/experimental-ct-react'
import {type SanityDocument} from '@sanity/types'

import {ArrayEditingStory} from './ArrayEditingStory'

const ANIMATION_DURATION = 400

const DOCUMENT_VALUE: SanityDocument = {
  _type: 'test',
  _createdAt: '',
  _updatedAt: '',
  _id: '123',
  _rev: '123',

  myArrayOfObjects: [
    {
      _type: 'myObject',
      _key: 'key-1',
      title: 'My object 1',
    },
    {
      _type: 'myObject',
      _key: 'key-2',
      title: 'My object 2',
    },
    {
      _type: 'myObject',
      _key: 'key-3',
      title: 'My object 3',
    },
    {
      _type: 'myObject',
      _key: 'key-4',
      title: 'My object 4',
      pte: [
        {
          _key: 'key-4-1',
          _type: 'myBlockObject',
          myBlockObjectArray: [
            {
              _type: 'myBlockObjectArrayItem',
              _key: 'key-4-1-1',
              title: 'My block object array item 1',
            },
            {
              _type: 'myBlockObjectArrayItem',
              _key: 'key-4-1-2',
              title: 'My block object array item 2',
            },
          ],
        },
      ],
    },
  ],

  pte: [
    {
      _key: 'key-1',
      _type: 'myBlockObject',
      myBlockObjectArray: [
        {
          _type: 'myBlockObjectArrayItem',
          _key: 'key-2-1',
          title: 'My block object array item 1',
        },
        {
          _type: 'myBlockObjectArrayItem',
          _key: 'key-2-2',
          title: 'My block object array item 2',
        },
      ],
    },
  ],

  myFieldsetArray: [
    {
      _type: 'myObject',
      _key: 'key-1',
      title: 'My object 1',
    },
    {
      _type: 'myObject',
      _key: 'key-2',
      title: 'My object 2',
    },
  ],
}

test.describe('Array editing', () => {
  test('should open array editing dialog when adding an item and close it when clicking done', async ({
    mount,
    page,
  }) => {
    await mount(<ArrayEditingStory />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Add an item
    await field.getByTestId('add-single-object-button').click()

    // Wait for the dialog to be visible
    await expect(page.getByTestId('array-editing-dialog')).toBeVisible()

    // Click done
    await page.getByTestId('array-editing-done').click()

    // Wait for the dialog to be hidden
    await expect(page.getByTestId('array-editing-dialog')).not.toBeVisible()
  })

  test('should open edit portal dialog when array editing is disabled in schema', async ({
    mount,
    page,
  }) => {
    await mount(<ArrayEditingStory legacyEditing />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Add an item
    await field.getByTestId('add-single-object-button').click()

    // Test that the legacy dialog is visible and the array editing dialog is not
    await expect(page.getByTestId('array-editing-dialog')).not.toBeVisible()
    await expect(page.getByTestId('edit-portal-dialog')).toBeVisible()
  })

  test.skip('should navigate using breadcrumbs menu', async () => {
    // todo: implement test
  })

  test('should open array editing dialog with correct form view based on the openPath', async ({
    mount,
    page,
  }) => {
    await mount(
      <ArrayEditingStory value={DOCUMENT_VALUE} openPath={['myArrayOfObjects', {_key: 'key-2'}]} />,
    )

    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).toBeVisible()

    const stringInput = dialog.getByTestId('string-input')
    await expect(stringInput).toHaveValue('My object 2')
  })

  test('should open dialog with correct form view based on the openPath when the array is in a fieldset', async ({
    mount,
    page,
  }) => {
    await mount(
      <ArrayEditingStory value={DOCUMENT_VALUE} openPath={['myFieldsetArray', {_key: 'key-2'}]} />,
    )

    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).toBeVisible()

    const stringInput = dialog.getByTestId('string-input')
    await expect(stringInput).toHaveValue('My object 2')
  })

  test('should not open dialog when the openPath does not match any item', async ({
    mount,
    page,
  }) => {
    await mount(
      <ArrayEditingStory
        value={DOCUMENT_VALUE}
        openPath={['myArrayOfObjects', {_key: 'NOT_FOUND_KEY'}]}
      />,
    )

    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).not.toBeVisible()
  })

  test('should open both array editing dialog and portable text dialog when the openPath points to an array field nested inside a portable text field', async ({
    mount,
    page,
  }) => {
    await mount(
      <ArrayEditingStory
        value={DOCUMENT_VALUE}
        openPath={[
          'myArrayOfObjects',
          {_key: 'key-4'},
          'pte',
          {_key: 'key-4-1'},
          'myBlockObjectArray',
          {_key: 'key-4-1-1'},
        ]}
      />,
    )
    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).toBeVisible()

    const editPortalDialog = page.getByTestId('edit-portal-dialog')
    await expect(editPortalDialog).toBeVisible()

    const stringInput = editPortalDialog.getByTestId('string-input')
    await expect(stringInput).toHaveValue('My block object array item 1')
  })

  test('should open only the portable text dialog when the openPath points directly to an array field inside a portable text field', async ({
    mount,
    page,
  }) => {
    await mount(
      <ArrayEditingStory
        value={DOCUMENT_VALUE}
        openPath={['pte', {_key: 'key-1'}, 'myBlockObjectArray', {_key: 'key-2-2'}]}
      />,
    )

    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).not.toBeVisible()

    const editPortalDialog = page.getByTestId('edit-portal-dialog')
    await expect(editPortalDialog).toBeVisible()
  })

  test('should focus root array item when closing array editing dialog', async ({mount, page}) => {
    await mount(<ArrayEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('array-editing-dialog')
    await expect(dialog).toBeVisible()

    // Focus first field
    await dialog.getByTestId('string-input').focus()

    // Click done
    await page.getByTestId('array-editing-done').click()

    // Wait for the dialog to be hidden
    await expect(dialog).not.toBeVisible()

    // Expect the first item in the array to be focused
    await expect(firstArrayItemButton).toBeFocused()
  })
})
