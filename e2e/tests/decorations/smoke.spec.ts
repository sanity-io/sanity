import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Decorations - renderMembers', () => {
  test('should render decorations at all levels', async ({page, createDraftDocument}) => {
    // Navigate to the decorations debug document
    await createDraftDocument('/content/input-debug;decorations')

    // Check that the document-level decoration is visible
    const decoration = page.getByText('This is a fancy decorated schema type!')
    await expect(decoration).toBeVisible()

    // Check that the fieldset decoration is visible
    const fieldsetDecoration = page.getByText('This is inside a fieldset')
    await expect(fieldsetDecoration).toBeVisible()

    // Check that the object decoration is visible
    const objectDecoration = page.getByText('This is inside an object')
    await expect(objectDecoration).toBeVisible()

    // Check that the location field is visible (contains image and file fields)
    const locationField = page.getByTestId('field-location')
    await expect(locationField).toBeVisible()

    // Check that the image decoration is visible
    const imageDecoration = page.getByText('This is a image decoration!')
    await expect(imageDecoration).toBeVisible()

    // Check that the file decoration is visible
    const fileDecoration = page.getByText('This is a file decoration!')
    await expect(fileDecoration).toBeVisible()
  })
})
