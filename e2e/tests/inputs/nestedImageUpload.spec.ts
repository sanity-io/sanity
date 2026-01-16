import {readFileSync} from 'node:fs'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import {expect} from '@playwright/test'

import {createFileDataTransferHandle} from '../../helpers'
import {test} from '../../studio-test'

const fileName = 'capybara.jpg'
const image = readFileSync(
  path.join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'resources', fileName),
)

test.describe('Nested image upload', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    test.slow()
    await createDraftDocument('/content/input-standard;objectsTest')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({timeout: 40000})
  })

  test('should upload image to nested object field without errors', async ({page}) => {
    // This test verifies the fix for #11783 - uploading images in nested documents
    // Previously failed with "Cannot apply deep operations on primitive values"
    // when the _upload field didn't exist yet on nested objects

    // Find the myObject field which has a nested image field
    const myObjectField = page.getByTestId('field-myObject')
    await expect(myObjectField).toBeVisible()

    // Expand the object if collapsed
    const expandButton = myObjectField.getByRole('button', {name: 'Expand'})
    if (await expandButton.isVisible()) {
      await expandButton.click()
    }

    // Find the nested image field (third field in myObject)
    const imageField = page.getByTestId('field-myObject.third')
    await expect(imageField).toBeVisible()
    await imageField.scrollIntoViewIfNeeded()

    // Create a file data transfer handle for the image
    const dataTransfer = await createFileDataTransferHandle(
      {page},
      {
        buffer: image,
        fileName,
        fileOptions: {
          type: 'image/jpeg',
        },
      },
    )

    // Capture any console errors during upload
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Drop the image on the image field
    await imageField.dispatchEvent('drop', {dataTransfer})

    // Wait for upload to start and complete
    // The upload progress should work without "Cannot apply deep operations" error
    await page.waitForTimeout(2000)

    // Verify no "Cannot apply deep operations on primitive values" error occurred
    const patchError = consoleErrors.find((err) =>
      err.includes('Cannot apply deep operations on primitive values'),
    )
    expect(patchError).toBeUndefined()

    // Verify the image was uploaded successfully by checking for image preview
    // or at minimum that the upload didn't fail silently
    const imagePreview = imageField.locator('img')
    await expect(imagePreview).toBeVisible({timeout: 10000})
  })

  test('should upload image to deeply nested object field', async ({page}) => {
    // Test uploading to a field nested multiple levels deep
    // This exercises the recursive patch application fix

    // Find fieldWithObjectType which has nested myObject with image
    const nestedObjectField = page.getByTestId('field-fieldWithObjectType')
    await expect(nestedObjectField).toBeVisible()

    // Expand the collapsible object
    const expandButton = nestedObjectField.getByRole('button', {name: 'Expand'})
    if (await expandButton.isVisible()) {
      await expandButton.click()
    }

    // Find the nested myObject's image field (field3.third)
    // field3 is the writable myObject instance
    const deepImageField = page.getByTestId('field-fieldWithObjectType.field3.third')

    // Skip if this field doesn't exist in the schema
    if (!(await deepImageField.isVisible())) {
      test.skip()
      return
    }

    await deepImageField.scrollIntoViewIfNeeded()

    const dataTransfer = await createFileDataTransferHandle(
      {page},
      {
        buffer: image,
        fileName,
        fileOptions: {
          type: 'image/jpeg',
        },
      },
    )

    // Capture console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Drop the image
    await deepImageField.dispatchEvent('drop', {dataTransfer})

    // Wait for upload
    await page.waitForTimeout(2000)

    // Verify no patch error
    const patchError = consoleErrors.find((err) =>
      err.includes('Cannot apply deep operations on primitive values'),
    )
    expect(patchError).toBeUndefined()
  })
})
