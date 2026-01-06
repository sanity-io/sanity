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

    const root = page.getByTestId('presentation-root')
    const previewIframe = root.locator('iframe')
    await expect(previewIframe.first()).toBeAttached()

    const previewIframeContents = previewIframe.first().contentFrame()
    await expect(previewIframeContents.locator('sanity-visual-editing')).toBeAttached()

    const viewportToggle = page.getByTestId('preview-viewport-toggle')

    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop')
    await expect(viewportToggle).toBeVisible()
    await expect(viewportToggle).toBeEnabled()

    // Click with extended timeout to handle any remaining animations
    await viewportToggle.click({timeout: 15000})
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'mobile')

    // Wait for URL to contain viewport=mobile parameter
    await expect(page).toHaveURL(/viewport=mobile/)

    // Wait for the viewport toggle to be ready for interaction again
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'mobile')

    // Re-query the element to ensure we have a fresh reference after state change
    const viewportToggleAfterSwitch = page.getByTestId('preview-viewport-toggle')
    await expect(viewportToggleAfterSwitch).toBeVisible()
    await expect(viewportToggleAfterSwitch).toBeEnabled()

    // Click with extended timeout to handle any remaining animations
    await viewportToggleAfterSwitch.click({timeout: 15000})

    // Wait for URL to no longer contain viewport=mobile parameter
    await expect(page).not.toHaveURL(/viewport=mobile/)

    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop')
  })
})
