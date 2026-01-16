import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Decorations - renderMembers', () => {
  test.beforeEach(async ({createDraftDocument}) => {
    // Navigate to the decorations debug document
    await createDraftDocument('/content/input-debug;decorations')
  })

  test('should render decoration at document level', async ({page}) => {
    // Check that the document-level decoration is visible
    const decoration = page.getByText('This is a fancy decorated schema type!')
    await expect(decoration).toBeVisible()
  })

  test('should render decoration inside a fieldset', async ({page}) => {
    // Check that the fieldset decoration is visible
    const fieldsetDecoration = page.getByText('This is inside a fieldset')
    await expect(fieldsetDecoration).toBeVisible()
  })

  test('should render decoration inside an object', async ({page}) => {
    // Check that the object decoration is visible
    const objectDecoration = page.getByText('This is inside an object')
    await expect(objectDecoration).toBeVisible()
  })

  test('should render decoration inside an image field', async ({page}) => {
    // First, we need to expand the location object to see the image field
    const locationField = page.getByTestId('field-location')
    await expect(locationField).toBeVisible()

    // The image field should be visible within the location object
    const imageField = page.getByTestId('field-location.image')
    await expect(imageField).toBeVisible()

    // Check that the image decoration is visible
    const imageDecoration = page.getByText('This is a image decoration!')
    await expect(imageDecoration).toBeVisible()
  })

  test('should render decoration inside a file field', async ({page}) => {
    // First, we need to expand the location object to see the file field
    const locationField = page.getByTestId('field-location')
    await expect(locationField).toBeVisible()

    // The file field should be visible within the location object
    const fileField = page.getByTestId('field-location.file')
    await expect(fileField).toBeVisible()

    // Check that the file decoration is visible
    const fileDecoration = page.getByText('This is a file decoration!')
    await expect(fileDecoration).toBeVisible()
  })
})
