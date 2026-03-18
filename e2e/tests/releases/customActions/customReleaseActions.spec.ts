import {expect, type Page} from '@playwright/test'

import {retryingClickUntilVisible} from '../../../helpers/retryingClick'
import {test} from '../../../studio-test'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialASAPReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  skipIfBrowser,
} from '../utils/methods'

test.describe('Custom Release Actions', () => {
  // Initialize IDs at module level to avoid linting issues
  const asapReleaseId: string = getRandomReleaseId()
  const uniqueReleaseTitle = `ASAP Release E2E Test ${asapReleaseId}`

  test.beforeAll(async ({sanityClient, browserName, _testContext}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    // Create the release
    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseId,
      metadata: {
        ...partialASAPReleaseMetadata,
        title: uniqueReleaseTitle,
      },
    })

    // Create documents for testing context passing
    for (let i = 0; i < 3; i++) {
      const versionDocumentId = _testContext.getUniqueDocumentId()
      const documentId = `versions.${asapReleaseId}.${versionDocumentId}`

      await createDocument(sanityClient, {
        ...speciesDocumentNameASAP,
        name: `Test Document ${i + 1}`,
        _id: documentId,
      })
    }
  })

  test.afterAll(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    await archiveAndDeleteRelease({sanityClient, dataset, releaseId: asapReleaseId})
  })

  const openReleaseMenu = async (page: Page, isOverview: boolean) => {
    const menuButton = isOverview
      ? page
          .getByRole('row')
          .filter({hasText: uniqueReleaseTitle})
          .first()
          .getByTestId('release-menu-button')
      : page.getByTestId('release-menu-button')

    await expect(menuButton).toBeVisible()
    await expect(menuButton).toBeEnabled()

    // A built-in menu item that is always present for active ASAP releases.
    // Used to verify the menu actually opened after clicking the button.
    // On the overview page, subscription updates can re-render the table and
    // swallow the click, so retrying with portal diagnostics helps debug failures.
    await retryingClickUntilVisible(
      page,
      menuButton,
      page.getByTestId('archive-release-menu-item'),
      {maxRetries: 5},
    )
  }

  const expectCustomActionInMenu = async (page: Page) => {
    const menuItem = page.getByRole('menuitem', {name: `E2E Test Action: ${uniqueReleaseTitle}`})
    await expect(menuItem).toBeVisible()
    await expect(menuItem).toBeEnabled()
    return menuItem
  }

  // Shared test suite function
  const createCustomActionTests = (contextName: string, setupPath: string, isOverview: boolean) => {
    test.describe(contextName, () => {
      test.beforeEach(async ({page}) => {
        test.slow()

        // Navigate and wait for the releases API response to complete
        // This ensures the release data is fully loaded before interacting with the page
        await Promise.all([
          page.waitForResponse(
            (response) => response.url().includes('/data/query/') && response.status() === 200,
          ),
          page.goto(setupPath),
        ])

        // Wait for page-specific elements to be ready
        if (isOverview) {
          // On overview page, wait for the releases table and the specific release row.
          // The table may render before all releases are loaded from subscriptions,
          // so waiting for the row ensures our test release data is available.
          await expect(page.getByRole('table')).toBeVisible()
          await expect(page.getByRole('row').filter({hasText: uniqueReleaseTitle})).toBeVisible({
            timeout: 30_000,
          })
        } else {
          // On individual release page, wait for the menu button
          await expect(page.getByTestId('release-menu-button')).toBeVisible()
        }
      })

      test('should display custom release actions in menu', async ({page}) => {
        await openReleaseMenu(page, isOverview)
        const menuItem = await expectCustomActionInMenu(page)
        await expect(menuItem).toBeVisible()
      })

      test('should show action as enabled', async ({page}) => {
        await openReleaseMenu(page, isOverview)
        const menuItem = await expectCustomActionInMenu(page)
        await expect(menuItem).toBeEnabled()
      })

      test('should verify context data', async ({page}) => {
        test.slow()
        const consoleMessages: string[] = []
        page.on('console', (msg) => {
          consoleMessages.push(msg.text())
        })

        await openReleaseMenu(page, isOverview)
        await expectCustomActionInMenu(page)
        // Click the menu item directly to avoid stale element references
        // The menu can re-render when release data updates, causing element detachment
        await page
          .getByRole('menuitem', {name: `E2E Test Action: ${uniqueReleaseTitle}`})
          .click({force: true})

        // Wait for the action to execute
        await page.waitForTimeout(1000)

        const allConsoleOutput = consoleMessages.join(' ')
        expect(allConsoleOutput).toContain('E2E Test Release Action executed!')
        expect(allConsoleOutput).toContain(`releaseTitle: ${uniqueReleaseTitle}`)
        expect(allConsoleOutput).toContain('documentCount:')
        expect(allConsoleOutput).toContain('releaseState: active')
        expect(allConsoleOutput).toContain('releaseId: _.releases.')
      })
    })
  }

  // Create test suites for both contexts
  createCustomActionTests('Release Overview', '/releases', true)
  createCustomActionTests('Release Detail', `/releases/${asapReleaseId}`, false)
})
