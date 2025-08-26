import {expect} from '@playwright/test'

import {test} from '../../../studio-test'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialASAPReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  deleteRelease,
  getRandomReleaseId,
  skipIfBrowser,
} from '../utils/methods'
import {
  publishAndConfirmRelease,
  publishAndConfirmReleaseMenu,
  revertAndConfirmRelease,
  scheduleAndConfirmReleaseMenu,
  unscheduleAndConfirmRelease,
} from '../utils/release-detail-ui-methods'

test.describe('Revert ASAP', () => {
  const asapReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName, page, _testContext}) => {
    skipIfBrowser(browserName)
    test.slow()

    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseIdTestOne,
      metadata: partialASAPReleaseMetadata,
    })

    const versionDocumentId = _testContext.getUniqueDocumentId()

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      name: 'published',
      _id: `${versionDocumentId}`,
    })

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${asapReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`/releases/${asapReleaseIdTestOne}`)

    await expect(page.getByTestId('release-type-picker')).toBeVisible()
  })

  test.afterEach(async ({sanityClient, browserName, page}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    const currentPageReleaseId = page.url().split('/').pop()

    try {
      await deleteRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    } catch (error) {
      console.warn('Failed to delete original release:', error.message)
    }

    if (currentPageReleaseId && currentPageReleaseId !== asapReleaseIdTestOne) {
      try {
        await archiveAndDeleteRelease({sanityClient, dataset, releaseId: currentPageReleaseId})
      } catch (error) {
        console.warn('Failed to delete reverted release:', error.message)
      }
    }
  })

  // Publish -> Revert -> ASAP release
  test('publish ASAP release, when reverted, should be ASAP release', async ({page}) => {
    await publishAndConfirmRelease({page})

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialASAPReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })

  // Schedule -> Wait -> Revert -> ASAP release
  test('schedule ASAP release, wait for it to be published. When reverted, should be ASAP release', async ({
    page,
  }) => {
    // schedule the release for (1 minute and 20 seconds) from now
    // this seems to be the lowest interval that works without hanging / flaking
    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(new Date().setSeconds(new Date().getSeconds() + 80)),
    })

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialASAPReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })

  // Schedule -> Unshedule -> Publish -> Revert -> ASAP release
  test('schedule ASAP release, unschedule, publish. When reverted, should be ASAP release', async ({
    page,
  }) => {
    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(new Date().setMinutes(new Date().getMinutes() + 20)),
    })

    await unscheduleAndConfirmRelease({page})

    await publishAndConfirmReleaseMenu({page})

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialASAPReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })
})
