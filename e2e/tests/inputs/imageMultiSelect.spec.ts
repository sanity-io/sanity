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

/**
 * E2E test for multi-image selection feature (#4483)
 *
 * Tests that when selecting images from the asset browser for an array of images,
 * users can select multiple images at once. The first image updates the current
 * field, and additional images are inserted as new array items.
 */
test.describe('Multi-image selection', () => {
  test('should allow selecting multiple images from asset browser in array context', async ({
    page,
    createDraftDocument,
  }) => {
    // Create a new imagesTest document
    await createDraftDocument('/content/input-standard;imagesTest')

    // Wait for the form to be ready
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // Scroll to the multiSelectGallery field
    const multiSelectField = page.getByTestId('field-multiSelectGallery')
    await multiSelectField.scrollIntoViewIfNeeded()
    await expect(multiSelectField).toBeVisible()

    // First, we need to upload some images to have assets available in the browser
    // Upload first image via drag-drop
    const dataTransfer1 = await createFileDataTransferHandle(
      {page},
      {
        buffer: image,
        fileName: 'test-image-1.jpg',
        fileOptions: {type: 'image/jpeg'},
      },
    )

    const arrayContainer = multiSelectField.locator('#multiSelectGallery')
    await arrayContainer.dispatchEvent('drop', {dataTransfer: dataTransfer1})

    // Select the default upload destination
    const uploadDestination = page.getByTestId('upload-destination-sanity-default')
    if (await uploadDestination.isVisible({timeout: 2000}).catch(() => false)) {
      await uploadDestination.click()
    }

    // Wait for the first image to be uploaded and displayed
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(1, {timeout: 30000})

    // Upload a second image
    const dataTransfer2 = await createFileDataTransferHandle(
      {page},
      {
        buffer: image,
        fileName: 'test-image-2.jpg',
        fileOptions: {type: 'image/jpeg'},
      },
    )
    await arrayContainer.dispatchEvent('drop', {dataTransfer: dataTransfer2})

    // Select upload destination again if shown
    if (await uploadDestination.isVisible({timeout: 2000}).catch(() => false)) {
      await uploadDestination.click()
    }

    // Wait for both images to be in the array
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(2, {timeout: 30000})

    // Now let's add an item using the asset browser to test multi-select
    // Click the "Add item" button for the array
    const addItemButton = multiSelectField.getByRole('button', {name: 'Add item...'})
    await addItemButton.click()

    // Click to add an image type
    const imageMenuItem = page.getByRole('menuitem', {name: 'Image'})
    await imageMenuItem.click()

    // A new image item is added - now open the asset browser
    // The new item should have an upload button
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(3, {timeout: 10000})

    // Get the newest (empty) image field and click its asset button
    const emptyImageField = arrayContainer.locator('[data-ui="Grid"] > div').last()
    await emptyImageField.scrollIntoViewIfNeeded()

    // Click the asset browser button to open asset selection
    const assetButton = emptyImageField.locator('[id$="_assetImageButton"]')
    await assetButton.click()

    // Click to browse from the default asset source
    const browseButton = page.getByTestId('file-input-browse-button-sanity-default')
    await browseButton.click()

    // Wait for the asset browser dialog to open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({timeout: 10000})

    // In multi-select mode, we should see checkboxes on images
    // Select the first two available images
    const assetImages = dialog.locator('img[data-id]')
    await expect(assetImages.first()).toBeVisible({timeout: 10000})

    // Click to select first image (in multi-select mode, this toggles selection)
    const firstImage = assetImages.first()
    await firstImage.click()

    // Verify the Select button shows count (e.g., "Select (1)")
    const selectButton = dialog.getByRole('button', {name: /Select/i})
    await expect(selectButton).toContainText('1')

    // Select second image
    const secondImage = assetImages.nth(1)
    await secondImage.click()

    // Verify the Select button shows count of 2
    await expect(selectButton).toContainText('2')

    // Click the Select button to confirm selection
    await selectButton.click()

    // The dialog should close
    await expect(dialog).not.toBeVisible({timeout: 5000})

    // Verify that multiple images were inserted into the array
    // We started with 3 items (2 uploaded + 1 empty), after selecting 2 images:
    // - The empty item gets the first selected image
    // - The second selected image creates a new sibling item
    // So we should have 4 items total
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(4, {timeout: 30000})
  })

  test('multi-select mode shows checkboxes on asset thumbnails', async ({
    page,
    createDraftDocument,
  }) => {
    // Create a new imagesTest document
    await createDraftDocument('/content/input-standard;imagesTest')

    // Wait for the form to be ready
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // Navigate to multiSelectGallery field
    const multiSelectField = page.getByTestId('field-multiSelectGallery')
    await multiSelectField.scrollIntoViewIfNeeded()

    // Upload an image to ensure we have assets
    const dataTransfer = await createFileDataTransferHandle(
      {page},
      {
        buffer: image,
        fileName: 'checkbox-test-image.jpg',
        fileOptions: {type: 'image/jpeg'},
      },
    )

    const arrayContainer = multiSelectField.locator('#multiSelectGallery')
    await arrayContainer.dispatchEvent('drop', {dataTransfer})

    const uploadDestination = page.getByTestId('upload-destination-sanity-default')
    if (await uploadDestination.isVisible({timeout: 2000}).catch(() => false)) {
      await uploadDestination.click()
    }

    // Wait for image to appear
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(1, {timeout: 30000})

    // Add new item and open asset browser
    const addItemButton = multiSelectField.getByRole('button', {name: 'Add item...'})
    await addItemButton.click()

    const imageMenuItem = page.getByRole('menuitem', {name: 'Image'})
    await imageMenuItem.click()

    // Get the new empty image field
    await expect(arrayContainer.locator('[data-ui="Grid"] > div')).toHaveCount(2, {timeout: 10000})
    const emptyImageField = arrayContainer.locator('[data-ui="Grid"] > div').last()

    // Open asset browser
    const assetButton = emptyImageField.locator('[id$="_assetImageButton"]')
    await assetButton.click()

    const browseButton = page.getByTestId('file-input-browse-button-sanity-default')
    await browseButton.click()

    // Wait for dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({timeout: 10000})

    // In multi-select mode, checkboxes should be visible on asset thumbnails
    // The checkbox is inside a div with specific styling
    const checkbox = dialog.locator('input[type="checkbox"]')
    await expect(checkbox.first()).toBeVisible({timeout: 10000})

    // Close the dialog
    const cancelButton = dialog.getByRole('button', {name: /Cancel/i})
    await cancelButton.click()
    await expect(dialog).not.toBeVisible()
  })
})
