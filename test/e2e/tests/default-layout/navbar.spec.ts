import {expect, test} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page, browserName}) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await expect(page.getByTestId('menu-button-resources')).toBeVisible()
  })

  test('render ActionModal on top of pane headers in structure tool', async ({page}) => {
    await expect(page.locator('data-testid=studio-navbar')).toBeVisible()
  })
})
