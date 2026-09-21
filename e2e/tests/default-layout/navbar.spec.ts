import {expect} from '@playwright/test'

import {takeChromaticSnapshot, test} from '../../studio-visual-test'

test.describe('@sanity/default-layout: Navbar', () => {
  test.beforeEach(async ({page, baseURL}) => {
    await page.goto(baseURL ?? '')
  })

  test('should show Help & Resource Menu', async ({page}, testInfo) => {
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    // Wait for tasks toolbar to be visible, when this is rendered it re renders the navbar. Causing flakiness in the next assertion
    await expect(page.getByTestId('tasks-toolbar')).toBeVisible()

    // UserMenu renders <UserAvatar user="me" />, which shows AvatarSkeleton while
    // useUser('me') resolves asynchronously (createHookFromObservableFactory always
    // starts loading=true even though userStore primes "me"). Navbar remounts (e.g.
    // after tasks-toolbar) restart that load. Wait for the settled Avatar so the
    // Chromatic archive does not flip between gray skeleton and colored initials.
    await expect(page.locator('#user-menu [data-ui="Avatar"]')).toBeVisible()

    // Snapshot before opening the help menu: its contents are fetched
    // remotely and change over time, while the navbar itself is stable.
    await takeChromaticSnapshot(page, 'studio navbar', testInfo)

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await expect(page.getByTestId('menu-button-resources')).toBeVisible()
  })
})
