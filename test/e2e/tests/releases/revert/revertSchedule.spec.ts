import {expect} from '@playwright/test'

import {test} from '../../../studio-test'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialScheduledReleaseMetadata} from '../utils/__fixtures__/releases'
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
  scheduleAndConfirmRelease,
} from '../utils/release-detail-ui-methods'

test.describe('Revert Scheduled', () => {
  const scheduledReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName, page, _testContext}) => {
    skipIfBrowser(browserName)
    test.slow()
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: scheduledReleaseIdTestOne,
      metadata: {
        ...partialScheduledReleaseMetadata,
        // schedule the release for (1 minute and 10 seconds) from now
        // this seems to be the lowest interval that works without hanging / flaking
        intendedPublishAt: new Date(
          new Date().setSeconds(new Date().getSeconds() + 70),
        ).toISOString(),
      },
    })

    const versionDocumentId = _testContext.getUniqueDocumentId()

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      name: 'published',
      _id: `${versionDocumentId}`,
    })

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${scheduledReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`/releases/${scheduledReleaseIdTestOne}`)

    await expect(page.getByTestId('release-type-picker')).toBeVisible()
  })

  test.afterEach(async ({sanityClient, browserName, page}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    const currentPageReleaseId = page.url().split('/').pop()

    try {
      await deleteRelease({sanityClient, dataset, releaseId: scheduledReleaseIdTestOne})
    } catch (error) {
      console.warn('Failed to delete original release:', error.message)
    }

    if (currentPageReleaseId && currentPageReleaseId !== scheduledReleaseIdTestOne) {
      try {
        await archiveAndDeleteRelease({sanityClient, dataset, releaseId: currentPageReleaseId})
      } catch (error) {
        console.warn('Failed to delete reverted release:', error.message)
      }
    }
  })

  // Schedule -> Wait -> Revert -> ASAP release
  test('schedule Scheduled release, wait for it to be published. When reverted, should be ASAP release', async ({
    page,
  }) => {
    // schedule the release for (1 minute and 10 seconds) from now
    // this seems to be the lowest interval that works without hanging / flaking
    await scheduleAndConfirmRelease({
      page,
      date: new Date(Date.now() + 70 * 1000),
    })

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialScheduledReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })

  // Schedule -> Unschedule -> Publish -> Revert -> ASAP release
  test('schedule Scheduled release, unschedule, publish. When reverted, should be ASAP release', async ({
    page,
  }) => {
    await scheduleAndConfirmRelease({
      page,
      date: new Date(new Date().setMinutes(new Date().getMinutes() + 20)),
    })

    await publishAndConfirmReleaseMenu({page})

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialScheduledReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })
})
