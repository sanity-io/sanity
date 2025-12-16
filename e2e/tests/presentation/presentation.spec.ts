import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Presentation', () => {
  test.beforeEach(async ({page}) => {
    test.slow()

    await page.goto('/presentation')
    // Wait for presentation to be visible
    await expect(page.getByTestId('presentation-root')).toBeVisible()
  })

  test('should be able to load a simple preview', async ({page}) => {
    test.slow()
    const root = page.getByTestId('presentation-root')
    await expect(root).toBeVisible()
    const previewIframe = root.locator('iframe')

    // Wait for iframe element to be attached to the DOM
    await expect(previewIframe.first()).toBeAttached()

    const previewIframeContents = previewIframe.first().contentFrame()

    // Wait for the visual editing component to be ready inside the iframe
    // This ensures the React app has hydrated and the useEffect has run
    await expect(previewIframeContents.locator('sanity-visual-editing')).toBeAttached()
  })

  test('should be able to toggle preview viewport', async ({page}) => {
    test.slow()
    const viewportToggle = page.getByTestId('preview-viewport-toggle')

    await expect(viewportToggle).toBeVisible()
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
