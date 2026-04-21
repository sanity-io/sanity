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

  /**
   * Opens the release menu and waits for it to be fully ready, including custom actions.
   *
   * The menu has two categories of items:
   * 1. Built-in items (e.g. archive) rendered synchronously by ReleaseMenu
   * 2. Custom actions resolved asynchronously via ReleaseActionsResolver + useEffect
   *
   * We use retryingClickUntilVisible to get the menu open (archive item visible),
   * then wait for the custom action menu item which resolves asynchronously.
   * If the custom action doesn't appear (e.g. the menu closed from a re-render),
   * we close, re-open, and retry the whole sequence.
   */
  const openReleaseMenuAndWaitForCustomActions = async (page: Page, isOverview: boolean) => {
    const menuButton = isOverview
      ? page
          .getByRole('row')
          .filter({hasText: uniqueReleaseTitle})
          .first()
          .getByTestId('release-menu-button')
      : page.getByTestId('release-menu-button')

    const customMenuItem = page.getByRole('menuitem', {
      name: `E2E Test Action: ${uniqueReleaseTitle}`,
    })

    await expect(menuButton).toBeVisible()
    await expect(menuButton).toBeEnabled()

    // Open the menu and wait for the built-in archive item to confirm it opened.
    // On the overview page, subscription updates can re-render the table and
    // swallow the click, so retrying with portal diagnostics helps debug failures.
    await retryingClickUntilVisible(
      page,
      menuButton,
      page.getByTestId('archive-release-menu-item'),
      {maxRetries: 5},
    )

    // The menu is now open. Custom actions are resolved asynchronously via
    // ReleaseActionsResolver -> useEffect -> state update -> render, so they
    // may not appear in the same frame as the built-in items.
    // Wait for the custom action with a generous timeout to account for this.
    await expect(customMenuItem).toBeVisible({timeout: 10_000})

    return customMenuItem
  }

  // Shared test suite function
  const createCustomActionTests = (contextName: string, setupPath: string, isOverview: boolean) => {
    test.describe(contextName, () => {
      test.beforeEach(async ({page}) => {
        // Navigate. The `page.goto` wrapper in studio-test.ts already defaults to
        // `waitUntil: 'domcontentloaded'`. We do NOT waitForLoadState('networkidle')
        // because the studio maintains open subscriptions / live queries and never
        // reaches networkidle under CI load — that would always hit the 60s test
        // timeout. The visibility assertions below are the real readiness gate.
        await page.goto(setupPath)

        // Wait for page-specific elements to be ready
        if (isOverview) {
          // On overview page, wait for the releases table and the specific release row.
          // The table may render before all releases are loaded from subscriptions,
          // so waiting for the row ensures our test release data is available.
          await expect(page.getByRole('table')).toBeVisible({timeout: 30_000})
          await expect(page.getByRole('row').filter({hasText: uniqueReleaseTitle})).toBeVisible({
            timeout: 30_000,
          })
        } else {
          // On individual release page, wait for the menu button
          await expect(page.getByTestId('release-menu-button')).toBeVisible({timeout: 30_000})
        }
      })

      test('should display custom release actions in menu', async ({page}) => {
        const menuItem = await openReleaseMenuAndWaitForCustomActions(page, isOverview)
        await expect(menuItem).toBeVisible()
      })

      test('should show action as enabled', async ({page}) => {
        const menuItem = await openReleaseMenuAndWaitForCustomActions(page, isOverview)
        await expect(menuItem).toBeEnabled()
      })

      test('should verify context data', async ({page}) => {
        const consoleMessages: string[] = []
        page.on('console', (msg) => {
          consoleMessages.push(msg.text())
        })

        const menuItem = await openReleaseMenuAndWaitForCustomActions(page, isOverview)

        // Click the custom action menu item.
        // Re-query the locator to avoid stale element references from re-renders.
        await menuItem.click({force: true})

        // Wait for the console message from the action handler rather than using
        // a fixed timeout which is unreliable in CI. Poll until the expected
        // output appears.
        await expect
          .poll(
            () => {
              const output = consoleMessages.join(' ')
              return output.includes('E2E Test Release Action executed!')
            },
            {
              message: 'Expected console output from custom release action',
              timeout: 5_000,
              intervals: [100, 250, 500, 1_000],
            },
          )
          .toBeTruthy()

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
