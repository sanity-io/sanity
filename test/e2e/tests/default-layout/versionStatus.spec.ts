import {expect} from '@playwright/test'
import {test} from '@sanity/test'

//non-updating studio case
test('should not show package version toast if not in auto-updating studio', async ({
  page,
  baseURL,
}) => {
  await page.goto(baseURL ?? '')

  await expect(page.getByText('New version available')).not.toBeVisible()
})

test.describe('auto-updating studio behavior', () => {
  //unfortunately, injecting the importmap script tag is a bit too slow
  //there are forthcoming tests that will e2e test auto-updating studio behavior
  test.skip()

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
    await expect(page.getByText('New version available')).toBeVisible()
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

    await expect(page.getByText('New version available')).not.toBeVisible()
  })
})
