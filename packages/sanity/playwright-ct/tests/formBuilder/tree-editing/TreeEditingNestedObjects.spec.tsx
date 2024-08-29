import {expect, test} from '@playwright/experimental-ct-react'
import {type SanityDocument} from '@sanity/types'

import {TreeEditingStory} from './TreeEditingStory'

const ANIMATION_DURATION = 600

const DOCUMENT_VALUE: SanityDocument = {
  _type: 'test',
  _createdAt: '',
  _updatedAt: '',
  _id: '123',
  _rev: '123',
  arrayWithNestedObjectsWithArray: [
    {
      _type: 'firstObject',
      _key: 'firstObject1',
      secondObject: {
        _type: 'secondObject',
        nestedArray: [
          {
            _type: 'nestedObject',
            _key: 'nestedObject1',
            nestedString: 'firstObject1.1 > secondObject > nestedArray > nestedObject1',
          },
          {
            _type: 'nestedObject',
            _key: 'nestedObject2',
            nestedString: 'firstObject1.2 > secondObject > nestedArray > nestedObject2',
          },
        ],
      },
    },
    {
      _type: 'firstObject',
      _key: 'firstObject2',
      secondObject: {
        _type: 'secondObject',
        nestedArray: [
          {
            _type: 'nestedObject',
            _key: 'nestedObject1',
            nestedString: 'firstObject2.1 > secondObject > nestedArray > nestedObject1',
          },
          {
            _type: 'nestedObject',
            _key: 'nestedObject2',
            nestedString: 'firstObject2.2 > secondObject > nestedArray > nestedObject2',
          },
        ],
      },
    },
  ],
}

test.skip('Tree Editing with nested objects', () => {
  test('should navigate and display nested objects correctly', async ({mount, page}) => {
    // Mount the TreeEditingStory component with initial open path
    await mount(
      <TreeEditingStory
        value={DOCUMENT_VALUE}
        openPath={['arrayWithNestedObjectsWithArray', {_key: 'firstObject1'}]}
      />,
    )

    const dialog = page.getByTestId('tree-editing-dialog')

    // Verify the nested array field is visible
    const nestedArrayField1 = dialog.getByTestId(
      'field-arrayWithNestedObjectsWithArray[_key=="firstObject1"].secondObject.nestedArray',
    )
    await expect(nestedArrayField1).toBeVisible()

    // Open the sidebar
    const sidebarToggleButton = dialog.getByTestId('tree-editing-sidebar-toggle')
    await sidebarToggleButton.click()

    await page.waitForTimeout(ANIMATION_DURATION)

    const sidebar = dialog.getByTestId('tree-editing-sidebar')

    // Expand the first root object
    const firstObjectExpandButton = sidebar.getByTestId(
      'tree-editing-menu-expand-button-arrayWithNestedObjectsWithArray[_key=="firstObject1"]',
    )
    await firstObjectExpandButton.click()

    // Expand the nested array
    const nestedArrayExpandButton1 = sidebar.getByTestId(
      'tree-editing-menu-expand-button-arrayWithNestedObjectsWithArray[_key=="firstObject1"].secondObject.nestedArray',
    )
    await nestedArrayExpandButton1.click()

    // Get the navigation buttons for nested objects
    const nestedObjectNavigateButton1 = sidebar.getByTestId(
      'tree-editing-menu-navigate-button-arrayWithNestedObjectsWithArray[_key=="firstObject1"].secondObject.nestedArray[_key=="nestedObject1"]',
    )
    const nestedObjectNavigateButton2 = sidebar.getByTestId(
      'tree-editing-menu-navigate-button-arrayWithNestedObjectsWithArray[_key=="firstObject1"].secondObject.nestedArray[_key=="nestedObject2"]',
    )

    // Verify the nested objects buttons are visible
    await expect(nestedObjectNavigateButton1).toBeVisible()
    await expect(nestedObjectNavigateButton2).toBeVisible()

    // Navigate to the first nested object and verify the the form is displayed
    await nestedObjectNavigateButton1.click()
    await page.waitForTimeout(ANIMATION_DURATION)
    const stringInput = dialog.getByTestId('string-input')
    await expect(stringInput).toHaveValue(
      'firstObject1.1 > secondObject > nestedArray > nestedObject1',
    )

    // Navigate to the second nested object and verify the the form is displayed
    await nestedObjectNavigateButton2.click()
    await page.waitForTimeout(ANIMATION_DURATION)
    await expect(stringInput).toHaveValue(
      'firstObject1.2 > secondObject > nestedArray > nestedObject2',
    )

    // Navigate to the second root object and verify the nested array field is visible
    const secondRootObjectNavigateButton = sidebar.getByTestId(
      'tree-editing-menu-navigate-button-arrayWithNestedObjectsWithArray[_key=="firstObject2"]',
    )
    await secondRootObjectNavigateButton.click()
    await page.waitForTimeout(ANIMATION_DURATION)
    const nestedArrayField2 = dialog.getByTestId(
      'field-arrayWithNestedObjectsWithArray[_key=="firstObject2"].secondObject.nestedArray',
    )
    await expect(nestedArrayField2).toBeVisible()
  })
})
