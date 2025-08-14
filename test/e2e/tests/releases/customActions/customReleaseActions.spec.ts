import {expect} from '@playwright/test'

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

const createCustomActionTests = (
  contextName: string,
  setupPath: string,
  isOverview: boolean,
  releaseId: string,
) => {
  const openReleaseMenu = async (page: any) => {
    if (isOverview) {
      // On overview page, find the release by title, then click its menu button
      const releaseRow = page.getByRole('row').filter({hasText: 'ASAP Release A'})
      await releaseRow.getByTestId('release-menu-button').click()
    } else {
      // On individual release page, click the menu button directly
      await page.getByTestId('release-menu-button').click()
    }
  }

  test.describe(contextName, () => {
    test.beforeEach(async ({page}) => {
      await page.goto(setupPath)
    })

    test('should display custom release actions in menu', async ({page}) => {
      await openReleaseMenu(page)
      await expect(
        page.getByRole('menuitem', {name: 'E2E Test Action: ASAP Release A'}),
      ).toBeVisible()
    })

    test('should show action as enabled', async ({page}) => {
      await openReleaseMenu(page)
      await expect(
        page.getByRole('menuitem', {name: 'E2E Test Action: ASAP Release A'}),
      ).toBeEnabled()
    })

    test('should verify context data', async ({page}) => {
      const consoleMessages: string[] = []
      page.on('console', (msg) => {
        consoleMessages.push(msg.text())
      })

      await openReleaseMenu(page)
      await page.getByRole('menuitem', {name: 'E2E Test Action: ASAP Release A'}).click()
      await page.waitForTimeout(1000)

      const allConsoleOutput = consoleMessages.join(' ')
      expect(allConsoleOutput).toContain('E2E Test Release Action executed!')
      expect(allConsoleOutput).toContain('releaseTitle: ASAP Release A')
      expect(allConsoleOutput).toContain('documentCount: 8')
      expect(allConsoleOutput).toContain('releaseState: active')
      expect(allConsoleOutput).toContain(`releaseId: _.releases.${releaseId}`)
    })

    test('should show tooltip with dynamic content', async ({page}) => {
      await openReleaseMenu(page)
      await page.getByRole('menuitem', {name: 'E2E Test Action: ASAP Release A'}).hover()
      await page.waitForTimeout(300)
      await expect(
        page.getByText('Test action for release "ASAP Release A" with 8 documents'),
      ).toBeVisible()
    })
  })
}

test.describe('Custom Release Actions', () => {
  const asapReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName, _testContext}) => {
    skipIfBrowser(browserName)
    test.slow()
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseIdTestOne,
      metadata: partialASAPReleaseMetadata,
    })

    // Create multiple documents to test context passing
    for (let i = 0; i < 8; i++) {
      const versionDocumentId = _testContext.getUniqueDocumentId()
      await createDocument(sanityClient, {
        ...speciesDocumentNameASAP,
        name: `Test Document ${i + 1}`,
        _id: `versions.${asapReleaseIdTestOne}.${versionDocumentId}`,
      })
    }
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    await archiveAndDeleteRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
  })

  createCustomActionTests('Release Overview', '/releases', true, asapReleaseIdTestOne)
  createCustomActionTests(
    'Release Detail',
    `/releases/${asapReleaseIdTestOne}`,
    false,
    asapReleaseIdTestOne,
  )
})
