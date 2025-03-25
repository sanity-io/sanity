import {expect, test} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}) => {
    const getStudioNavbar = () => page.getByTestId('studio-navbar')
    const getTasksToolbar = () => page.getByTestId('tasks-toolbar')
    const getHelpResources = () => page.getByLabel('Help and resources')
    const getMenuButtonResources = () => page.getByTestId('menu-button-resources')

    await expect(getStudioNavbar()).toBeVisible()

    // Wait for tasks toolbar to be visible, when this is rendered it re renders the navbar. Causing flakiness in the next assertion
    await expect(getTasksToolbar()).toBeVisible()

    await expect(getHelpResources()).toBeVisible()

    expect(getHelpResources()).toBeVisible()

    await getHelpResources().click()

    await expect(getMenuButtonResources()).toBeVisible()
  })
})
