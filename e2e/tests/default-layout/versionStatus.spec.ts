import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('auto-updating studio behavior', () => {
  test('should facilitate reload if in auto-updating studio, and version is higher than minversion from importmap', async ({
    page,
    baseURL,
    browserName,
  }) => {
    // Skip Firefox - import maps must be present in HTML before any module scripts are parsed,
    // and Firefox has stricter timing around when dynamically injected import maps take effect.
    // The addInitScript approach works in Chromium but not reliably in Firefox.
    test.skip(
      browserName === 'firefox',
      'Firefox has timing issues with dynamically injected import maps',
    )
    test.slow()

    // Set up route interception BEFORE navigating so all requests are caught
    await page.route('https://sanity-cdn.**/v1/modules/sanity/latest/**', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          packageVersion: '4.2.0',
          latest: '4.2.0',
        }),
      })
    })

    await page.goto(baseURL ?? '', {waitUntil: 'domcontentloaded'})

    // Inject a script tag with importmap into the page
    await page.evaluate(() => {
      const importMap = {
        imports: {
          sanity: 'https://example.com/v1/modules/sanity/default/%5E4.1.0/t1754072932',
        },
      }
      const script = document.createElement('script')
      script.type = 'importmap'
      script.textContent = JSON.stringify(importMap)
      document.head.appendChild(script)
    })

    // Wait for the resources menu button to be ready
    const resourcesMenuButton = page.getByTestId('button-resources-menu')
    await expect(resourcesMenuButton).toBeVisible()
    await expect(resourcesMenuButton).toBeEnabled()

    // Click to open the menu
    await resourcesMenuButton.click()

    // Wait for menu to be visible before checking for the update item
    await expect(page.getByTestId('menu-item-update-studio-now')).toBeVisible({timeout: 10000})

    // Verify the mock version is actually being displayed in the UI
    // This proves the mock is working and not falling back to real API
    await expect(page.getByTestId('menu-item-update-studio-now')).toContainText('4.2.0')
  })
})
