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

    // UserMenu renders <UserAvatar user="me" /> from the current user the studio already holds,
    // so the avatar paints with the navbar rather than after a skeleton. Still wait for it so
    // the Chromatic archive is taken of a navbar that has finished (re)mounting.
    await expect(page.locator('#user-menu [data-ui="Avatar"]')).toBeVisible()

    // The navbar settles while the tool under it is still empty. The root pane
    // starts as a LOADING_PANE and StructureToolPane then lazy-loads the pane
    // component, so there is a window with no LoadingBlock at all — waiting
    // only for loading blocks to disappear archives that empty tool area.
    // Wait for the resolved root list pane instead.
    await expect(page.getByTestId('structure-tool-list-pane')).toBeVisible()

    // Snapshot before opening the help menu: its contents are fetched
    // remotely and change over time, while the navbar itself is stable.
    await takeChromaticSnapshot(page, 'studio navbar', testInfo)

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await expect(page.getByLabel('Help and resources')).toBeVisible()

    await page.getByLabel('Help and resources').click()

    await expect(page.getByTestId('menu-button-resources')).toBeVisible()
  })
})
