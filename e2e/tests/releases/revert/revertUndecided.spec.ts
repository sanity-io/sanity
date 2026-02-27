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
  test.skip()

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
  })

  test.afterEach(async ({sanityClient, browserName, page}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    // used for the new releases that have been created from the revert
    const currentPageReleaseId = page.url().split('/').pop()

    await Promise.all(
      [
        deleteRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne}),
        currentPageReleaseId
          ? archiveAndDeleteRelease({sanityClient, dataset, releaseId: currentPageReleaseId})
          : null,
      ].filter(Boolean),
    )
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

    // retention policy card
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialUndecidedReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('As soon as possible')
  })

  // Publish -> Revert -> ASAP release
  test('publish Undecided release, when reverted, should be ASAP release', async ({page}) => {
    await publishAndConfirmReleaseMenu({page})

    // retention policy card
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await revertAndConfirmRelease({page})

    await expect(page.getByTestId('revert-stage-success-link')).toBeVisible()
    await page.getByTestId('revert-stage-success-link').click()

    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(
      page.getByRole('button', {
        name: `Reverting "${partialUndecidedReleaseMetadata.title}"`,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('release-type-picker')).toHaveText('As soon as possible')
  })
})
