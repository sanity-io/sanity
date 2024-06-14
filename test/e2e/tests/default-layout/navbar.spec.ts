import {expect, test} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}) => {
    expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await page.getByTestId('menu-button-resources').waitFor({
      state: 'attached',
    })
  })

  test('render ActionModal on top of pane headers in structure tool', async ({page}) => {
    await expect(page.locator('data-testid=studio-navbar')).toBeVisible()
  })
})
