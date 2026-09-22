import {expect} from '@playwright/test'

import {takeChromaticSnapshot, test} from '../../studio-visual-test'

test.describe('@sanity/default-layout: Navbar', () => {
  // The root structure list opens with a `documentListItem` for the
  // `validation` document, so its first row is dataset-dependent content — the
  // one thing an e2e archive is not supposed to contain. It cannot be waited
  // out either: the Chromatic fixture instruments the page over CDP, which
  // breaks the studio's streaming connections, so the preview resolved in 2 of
  // 13 local runs and kept its media and text skeletons indefinitely in the
  // rest. Both outcomes are pixel-different, so keep that row out of the
  // comparison rather than letting it flip the build.
  test.use({
    ignoreSelectors: ['[data-testid="structure-tool-list-pane"] a[href$="/content/validation"]'],
  })

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
