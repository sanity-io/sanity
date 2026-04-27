import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {TreeEditingStory} from './TreeEditingStory'

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

describe.skip('Tree editing', () => {
  it('should open tree editing dialog when adding an item and close it when clicking done', async () => {
    render(<TreeEditingStory />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Add an item
    await field.getByTestId('add-single-object-button').click()

    // Wait for the dialog to be visible
    await expect.element(page.getByTestId('tree-editing-dialog')).toBeVisible()

    // Click done
    await page.getByTestId('tree-editing-done').click()

    // Wait for the dialog to be hidden
    await expect.element(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
  })

  it('should open edit portal dialog when tree editing is disabled in schema', async () => {
    render(<TreeEditingStory legacyEditing />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Add an item
    await field.getByTestId('add-single-object-button').click()

    // Test that the legacy dialog is visible and the tree editing dialog is not
    await expect.element(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    await expect.element(page.getByTestId('edit-portal-dialog')).toBeVisible()
  })

  it('should navigate using tree menu in the sidebar', async () => {
    render(<TreeEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    // Expect the string input to have the value of the first item
    const firstObjectStringInput = dialog.getByTestId('string-input')
    await expect.element(firstObjectStringInput).toHaveValue('My object 1')

    // Click on the sidebar toggle button in the dialog to open the sidebar
    const sidebarButton = dialog.getByTestId('tree-editing-sidebar-toggle')
    await sidebarButton.click()

    // Expect the sidebar to be opened
    const sidebar = dialog.getByTestId('tree-editing-sidebar')
    await expect.element(sidebar).toBeVisible()

    // Expect all three items to be in the tree menu in the sidebar
    await expect.element(sidebar.getByRole('button', {name: 'My object 1'})).toBeVisible()
    await expect.element(sidebar.getByRole('button', {name: 'My object 2'})).toBeVisible()
    await expect.element(sidebar.getByRole('button', {name: 'My object 3'})).toBeVisible()

    // Click on the second item in the tree menu in the sidebar
    const secondTreeMenuItem = sidebar.getByRole('button', {name: 'My object 2'})
    await secondTreeMenuItem.click()

    await new Promise((r) => setTimeout(r, ANIMATION_DURATION))

    // Expect the form view to have changed to the second item
    const secondObjectStringInput = dialog.getByTestId('string-input')
    await expect.element(secondObjectStringInput).toHaveValue('My object 2')
  })

  it('should navigate using breadcrumbs menu', async () => {
    render(<TreeEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    // Expect the string input to have the value of the first item
    const firstObjectStringInput = dialog.getByTestId('string-input')
    await expect.element(firstObjectStringInput).toHaveValue('My object 1')

    // Open the breadcrumb menu
    const breadcrumbMenuButton = dialog.getByTestId('tree-editing-breadcrumb-menu-button')
    await breadcrumbMenuButton.click()

    await new Promise((r) => setTimeout(r, ANIMATION_DURATION))

    // Expect the breadcrumb menu to be opened
    const breadcrumbMenuPopover = page.getByTestId('tree-editing-breadcrumbs-menu-popover')
    await expect.element(breadcrumbMenuPopover).toBeVisible()

    // Expect all three items to be in the breadcrumb menu
    await expect
      .element(breadcrumbMenuPopover.getByRole('button', {name: 'My object 1'}))
      .toBeVisible()
    await expect
      .element(breadcrumbMenuPopover.getByRole('button', {name: 'My object 2'}))
      .toBeVisible()
    await expect
      .element(breadcrumbMenuPopover.getByRole('button', {name: 'My object 3'}))
      .toBeVisible()

    // Navigate to the third item in the breadcrumb menu using the keyboard.
    // Since the fist item is selected, the second item in the menu is the initial
    // focused item. Therefore, we need to press the down arrow key only once
    // to select the third item.
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    await new Promise((r) => setTimeout(r, ANIMATION_DURATION))

    // Expect the breadcrumb menu to be closed after selecting an item
    await expect.element(breadcrumbMenuPopover).not.toBeVisible()

    await new Promise((r) => setTimeout(r, ANIMATION_DURATION))

    // Expect the form view to have changed to the third item
    const thirdObjectStringInput = dialog.getByTestId('string-input')
    await expect.element(thirdObjectStringInput).toHaveValue('My object 3')
  })

  it('should open tree editing dialog with correct form view based on the openPath', async () => {
    render(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['myArrayOfObjects', {_key: 'key-2'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    const stringInput = dialog.getByTestId('string-input')
    await expect.element(stringInput).toHaveValue('My object 2')
  })

  it('should open dialog with correct form view based on the openPath when the array is in a fieldset', async () => {
    render(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['myFieldsetArray', {_key: 'key-2'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    const stringInput = dialog.getByTestId('string-input')
    await expect.element(stringInput).toHaveValue('My object 2')
  })

  it('should not open dialog when the openPath does not match any item', async () => {
    render(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['myArrayOfObjects', {_key: 'NOT_FOUND_KEY'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).not.toBeVisible()
  })

  it('should open both tree editing dialog and portable text dialog when the openPath points to an array field nested inside a portable text field', async () => {
    render(
      <TreeEditingStory
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
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    const editPortalDialog = page.getByTestId('edit-portal-dialog')
    await expect.element(editPortalDialog).toBeVisible()

    const stringInput = editPortalDialog.getByTestId('string-input')
    await expect.element(stringInput).toHaveValue('My block object array item 1')
  })

  it('should open only the portable text dialog when the openPath points directly to an array field inside a portable text field', async () => {
    render(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['pte', {_key: 'key-1'}, 'myBlockObjectArray', {_key: 'key-2-2'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).not.toBeVisible()

    const editPortalDialog = page.getByTestId('edit-portal-dialog')
    await expect.element(editPortalDialog).toBeVisible()
  })

  it('should focus root array item when closing tree editing dialog', async () => {
    render(<TreeEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect.element(dialog).toBeVisible()

    // Focus first field
    await dialog.getByTestId('string-input').element().focus()

    // Click done
    await page.getByTestId('tree-editing-done').click()

    // Wait for the dialog to be hidden
    await expect.element(dialog).not.toBeVisible()

    // Expect the first item in the array to be focused
    await expect.element(firstArrayItemButton).toHaveFocus()
  })
})
