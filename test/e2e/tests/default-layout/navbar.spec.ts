import {expect, test} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}) => {
    const getHelpResources = () => page.getByLabel('Help and resources')

    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    // Wait for tasks toolbar to be visible, when this is rendered it re renders the navbar. Causing flakiness in the next assertion
    await expect(page.getByTestId('tasks-toolbar')).toBeVisible()

    await expect(getHelpResources()).toBeVisible()

    expect(getHelpResources()).toBeVisible()

    await getHelpResources().click()

    await expect(page.getByTestId('menu-button-resources')).toBeVisible()
  })
})
