import {expect} from '@playwright/test'

import {takeChromaticSnapshot, test} from '../../studio-test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}, testInfo) => {
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    // Wait for tasks toolbar to be visible, when this is rendered it re renders the navbar. Causing flakiness in the next assertion
    await expect(page.getByTestId('tasks-toolbar')).toBeVisible()

    // Snapshot before opening the help menu: its contents are fetched
    // remotely and change over time, while the navbar itself is stable.
    await takeChromaticSnapshot(page, 'studio navbar', testInfo)

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await expect(page.getByTestId('menu-button-resources')).toBeVisible()
  })
})
