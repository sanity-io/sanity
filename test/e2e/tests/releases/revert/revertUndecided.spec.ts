import {expect} from '@playwright/test'

import {test} from '../../../studio-test'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialUndecidedReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  deleteRelease,
  getRandomReleaseId,
  skipIfBrowser,
} from '../utils/methods'
import {
  publishAndConfirmReleaseMenu,
  revertAndConfirmRelease,
  scheduleAndConfirmReleaseMenu,
} from '../utils/release-detail-ui-methods'

test.describe('Revert Undecided', () => {
  const undecidedReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName, page, _testContext}) => {
    skipIfBrowser(browserName)
    test.slow()
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: undecidedReleaseIdTestOne,
      metadata: partialUndecidedReleaseMetadata,
    })

    const versionDocumentId = _testContext.getUniqueDocumentId()

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      name: 'published',
      _id: `${versionDocumentId}`,
    })

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${undecidedReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`/releases/${undecidedReleaseIdTestOne}`)

    await expect(page.getByTestId('release-type-picker')).toBeVisible()
  })

  test.afterEach(async ({sanityClient, browserName, page}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    const currentPageReleaseId = page.url().split('/').pop()

    try {
      await deleteRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne})
    } catch (error) {
      console.warn('Failed to delete original release:', error.message)
    }

    if (currentPageReleaseId && currentPageReleaseId !== undecidedReleaseIdTestOne) {
      try {
        await archiveAndDeleteRelease({sanityClient, dataset, releaseId: currentPageReleaseId})
      } catch (error) {
        console.warn('Failed to delete reverted release:', error.message)
      }
    }
  })

  // Schedule -> Wait -> Revert -> ASAP release
  test('schedule Undecided release, wait for it to be published. When reverted, should be ASAP release', async ({
    page,
  }) => {
    // schedule the release for (1 minute and 10 seconds) from now
    // this seems to be the lowest interval that works without hanging / flaking
    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(Date.now() + 70 * 1000),
    })

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialUndecidedReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })

  // Schedule -> Unschedule -> Publish -> Revert -> ASAP release
  test('schedule Undecided release, unschedule, publish. When reverted, should be ASAP release', async ({
    page,
  }) => {
    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(new Date().setMinutes(new Date().getMinutes() + 20)),
    })

    await publishAndConfirmReleaseMenu({page})

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialUndecidedReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })
})
