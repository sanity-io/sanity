import {expect} from '@playwright/test'
import {test} from '@sanity/test'

//non-updating studio case
test('should not show package version toast if not in auto-updating studio', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? '')

  const getStudioUpdatedText = () => page.getByText('Sanity Studio was updated')
  await expect(getStudioUpdatedText()).not.toBeVisible()
})

test.describe('auto-updating studio behavior', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '', {waitUntil: 'domcontentloaded'})
    // Inject a script tag with importmap into the page
    await page.evaluate(() => {
      const importMap = {
        imports: {
          sanity: 'https://sanity-cdn.com/v1/modules/sanity/default/example.js',
        },
      }
      const script = document.createElement('script')
      script.type = 'importmap'
      script.textContent = JSON.stringify(importMap)
      document.head.appendChild(script)
    })
  })

  test('should facilitate reload if in auto-updating studio, and version is higher', async ({
    page,
  }) => {
    // Intercept the API request and provide a mock response
    await page.route('https://sanity-cdn.**/v1/modules/sanity/default/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          packageVersion: '3.1000.0',
        }),
      })
    })

    const getStudioReadyUpdateText = () => page.getByText('Sanity Studio is ready to update')
    await expect(getStudioReadyUpdateText()).toBeVisible()
  })

  test('should show nothing if in auto-updating studio, and version is lower', async ({page}) => {
    // Intercept the API request and provide a mock response
    await page.route('https://sanity-cdn.**/v1/modules/sanity/default/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          packageVersion: '3.0.0',
        }),
      })
    })

    const getStudioReadyUpdateText = () => page.getByText('Sanity Studio is ready to update')
    await expect(getStudioReadyUpdateText()).not.toBeVisible()
  })
})
