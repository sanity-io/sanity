import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('auto-updating studio behavior', () => {
  test.beforeEach(async ({page, baseURL}) => {
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
  })

  test('should facilitate reload if in auto-updating studio, and version is higher than minversion from importmap', async ({
    page,
  }) => {
    // Intercept the API request and provide a mock response
    await page.route('https://sanity-cdn.**/v1/modules/sanity/default/**', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          packageVersion: '4.2.0',
        }),
      })
    })
    await page.getByTestId('button-resources-menu').click()
    await expect(page.getByTestId('menu-item-update-studio-now')).toBeVisible()
  })
})
