import {expect, test} from '@playwright/experimental-ct-react'
import {type SanityDocument} from '@sanity/types'

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
  ],
}

test.describe('Tree editing', () => {
  test('should open dialog when adding an item and close it when clicking done', async ({
    mount,
    page,
  }) => {
    await mount(<TreeEditingStory />)

    // Add an item
    await page.getByTestId('add-single-object-button').click()

    // Wait for the dialog to be visible
    await expect(page.getByTestId('tree-editing-dialog')).toBeVisible()

    // Click done
    await page.getByTestId('tree-editing-done').click()

    // Wait for the dialog to be hidden
    await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
  })

  test('should open edit portal dialog when tree editing is disabled in schema', async ({
    mount,
    page,
  }) => {
    await mount(<TreeEditingStory legacyEditing />)

    // Add an item
    await page.getByTestId('add-single-object-button').click()

    // Test that the legacy dialog is visible and the tree editing dialog is not
    await expect(page.getByTestId('tree-editing-dialog')).not.toBeVisible()
    await expect(page.getByTestId('edit-portal-dialog')).toBeVisible()
  })

  test('should navigate using tree menu in the sidebar', async ({mount, page}) => {
    await mount(<TreeEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect(dialog).toBeVisible()

    // Expect the string input to have the value of the first item
    const firstObjectStringInput = dialog.getByTestId('string-input')
    await expect(firstObjectStringInput).toHaveValue('My object 1')

    // Click on the sidebar toggle button in the dialog to open the sidebar
    const sidebarButton = dialog.getByTestId('tree-editing-sidebar-toggle')
    await sidebarButton.click()

    // Expect the sidebar to be opened
    const sidebar = dialog.getByTestId('tree-editing-sidebar')
    await expect(sidebar).toBeVisible()

    // Expect all three items to be in the tree menu in the sidebar
    await expect(sidebar.getByRole('button', {name: 'My object 1'})).toBeVisible()
    await expect(sidebar.getByRole('button', {name: 'My object 2'})).toBeVisible()
    await expect(sidebar.getByRole('button', {name: 'My object 3'})).toBeVisible()

    // Click on the second item in the tree menu in the sidebar
    const secondTreeMenuItem = sidebar.getByRole('button', {name: 'My object 2'})
    await secondTreeMenuItem.click()

    await page.waitForTimeout(ANIMATION_DURATION)

    // Expect the form view to have changed to the second item
    const secondObjectStringInput = dialog.getByTestId('string-input')
    await expect(secondObjectStringInput).toHaveValue('My object 2')
  })

  test('should navigate using breadcrumbs menu', async ({mount, page}) => {
    await mount(<TreeEditingStory value={DOCUMENT_VALUE} />)

    const field = page.getByTestId('field-myArrayOfObjects')

    // Click on the first item in the array inputs
    const firstArrayItemButton = field.getByRole('button', {name: 'My object 1'})
    await firstArrayItemButton.click()

    // Expect the dialog to open
    const dialog = page.getByTestId('tree-editing-dialog')
    await expect(dialog).toBeVisible()

    // Expect the string input to have the value of the first item
    const firstObjectStringInput = dialog.getByTestId('string-input')
    await expect(firstObjectStringInput).toHaveValue('My object 1')

    // Open the breadcrumb menu
    const breadcrumbMenuButton = dialog.getByTestId('tree-editing-breadcrumb-menu-button')
    await breadcrumbMenuButton.click()

    await page.waitForTimeout(ANIMATION_DURATION)

    // Expect the breadcrumb menu to be opened
    const breadcrumbMenuPopover = page.getByTestId('tree-editing-breadcrumbs-menu-popover')
    await expect(breadcrumbMenuPopover).toBeVisible()

    // Expect all three items to be in the breadcrumb menu
    await expect(breadcrumbMenuPopover.getByRole('button', {name: 'My object 1'})).toBeVisible()
    await expect(breadcrumbMenuPopover.getByRole('button', {name: 'My object 2'})).toBeVisible()
    await expect(breadcrumbMenuPopover.getByRole('button', {name: 'My object 3'})).toBeVisible()

    // Navigate to the third item in the breadcrumb menu using the keyboard.
    // Since the fist item is selected, the second item in the menu is the initial
    // focused item. Therefore, we need to press the down arrow key only once
    // to select the third item.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await page.waitForTimeout(ANIMATION_DURATION)

    // Expect the breadcrumb menu to be closed after selecting an item
    expect(breadcrumbMenuPopover).not.toBeVisible()

    await page.waitForTimeout(ANIMATION_DURATION)

    // Expect the form view to have changed to the third item
    const thirdObjectStringInput = dialog.getByTestId('string-input')
    await expect(thirdObjectStringInput).toHaveValue('My object 3')
  })

  test('should open dialog with correct form view based on the openPath', async ({mount, page}) => {
    await mount(
      <TreeEditingStory value={DOCUMENT_VALUE} openPath={['myArrayOfObjects', {_key: 'key-2'}]} />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect(dialog).toBeVisible()

    const stringInput = dialog.getByTestId('string-input')
    await expect(stringInput).toHaveValue('My object 2')
  })

  test('should not open dialog when the openPath does not match any item', async ({
    mount,
    page,
  }) => {
    await mount(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['myArrayOfObjects', {_key: 'NOT_FOUND_KEY'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')
    await expect(dialog).not.toBeVisible()
  })
})
