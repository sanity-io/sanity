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

  test('should be able to toggle preview viewport', async ({page, browserName}) => {
    // For now, only test in other browsers except firefox due to flakiness in Firefox with the requests
    test.skip(browserName === 'firefox')
    test.slow()

    const root = page.getByTestId('presentation-root')
    const previewIframe = root.locator('iframe')
    await expect(previewIframe.first()).toBeAttached()

    const previewIframeContents = previewIframe.first().contentFrame()
    await expect(previewIframeContents.locator('sanity-visual-editing')).toBeAttached()

    const viewportToggle = page.getByTestId('preview-viewport-toggle')

    // Wait for the button to be in the DOM and fully rendered
    await expect(viewportToggle).toBeAttached({timeout: 15000})
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop', {timeout: 10000})
    await expect(viewportToggle).toBeVisible()
    await expect(viewportToggle).toBeEnabled()

    // Wait for the button to be stable before interacting
    await viewportToggle.evaluate((el) => {
      return new Promise((resolve) => {
        // Wait a tick to ensure all React state updates have settled
        setTimeout(resolve, 100)
      })
    })

    // Use force click to bypass potential tooltip/overlay interference
    // This is more reliable in Firefox where the button might be reported as
    // visible/enabled but still have pointer event issues
    await viewportToggle.click({force: true, timeout: 15000})

    // Verify the state changed
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'mobile', {timeout: 10000})

    // Wait for URL to contain viewport=mobile parameter
    await expect(page).toHaveURL(/viewport=mobile/, {timeout: 10000})

    // Wait for the viewport toggle to stabilize again
    await viewportToggle.evaluate((el) => {
      return new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    })

    // Re-query the element to ensure we have a fresh reference after state change
    const viewportToggleAfterSwitch = page.getByTestId('preview-viewport-toggle')
    await expect(viewportToggleAfterSwitch).toBeVisible()
    await expect(viewportToggleAfterSwitch).toBeEnabled()
    await expect(viewportToggleAfterSwitch).toHaveAttribute('data-viewport', 'mobile')

    // Use dispatchEvent for the second toggle to bypass Playwright's scroll-into-view
    // behavior which can timeout in Firefox after viewport changes
    await viewportToggleAfterSwitch.dispatchEvent('click')

    // Wait for URL to no longer contain viewport=mobile parameter
    await expect(page).not.toHaveURL(/viewport=mobile/, {timeout: 10000})

    // Verify we're back to desktop
    await expect(viewportToggle).toHaveAttribute('data-viewport', 'desktop', {timeout: 10000})
  })
})
