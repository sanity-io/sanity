import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {getPresentationRegions, openPresentationTool} from './utils'

test.describe('Presentation', () => {
  test('should be able to load a simple preview', async ({page}) => {
    await openPresentationTool(page)

    const {previewIframeContents} = await getPresentationRegions(page)

    // Checks that the preview iframe has loaded visual editing
    await expect(previewIframeContents.locator('sanity-visual-editing')).toBeAttached()
  })

  test('should be able to toggle preview viewport', async ({page}) => {
    await openPresentationTool(page)

    const {root} = await getPresentationRegions(page)
    const viewportToggle = await root.getByTestId('preview-viewport-toggle')

    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop')
    await viewportToggle.click()
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'mobile')

    // Wait for URL to contain viewport=mobile parameter
    await expect(page).toHaveURL(/viewport=mobile/)

    await viewportToggle.click()

    // Wait for URL to no longer contain viewport=mobile parameter
    await expect(page).not.toHaveURL(/viewport=mobile/)

    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop')
  })
})
