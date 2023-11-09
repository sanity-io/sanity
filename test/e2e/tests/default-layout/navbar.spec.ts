import {test, expect} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}) => {
    expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await page.getByText(/Sanity Studio version/i).waitFor({
      state: 'visible',
    })
  })
})
