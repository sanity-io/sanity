import {expect} from '@playwright/test'

import {test} from '../fixtures/harFixture'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialUndecidedReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  archiveRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  skipIfBrowser,
  unarchiveRelease,
} from '../utils/methods'
import {
  scheduleAndConfirmReleaseMenu,
  unscheduleAndConfirmRelease,
} from '../utils/release-detail-ui-methods'

test.describe('Unarchive Undecided', () => {
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
      _id: `versions.${undecidedReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${undecidedReleaseIdTestOne}`)
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await Promise.all([
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne}),
    ])
  })

  // Archive -> Unarchive -> Undecided release
  test('Initially Undecided release type should be ASAP type', async ({page, sanityClient}) => {
    const dataset = sanityClient.config().dataset
    await archiveRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).toHaveText('Undecided')
  })

  // Once a release of any type of scheduled, the type should be changed to that, so when it's unarchived, the type should be scheduled
  // Schedule -> Unschedule -> Archive -> Unarchive -> Scheduled release
  test('Initially Undecided when set to a scheduled time, then archived and unarchived should be Scheduled release type', async ({
    page,
    sanityClient,
  }) => {
    const dataset = sanityClient.config().dataset

    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(new Date().setMinutes(new Date().getMinutes() + 20)),
    })

    await unscheduleAndConfirmRelease({page})

    await archiveRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne})

    // has unarchived
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).not.toHaveText('Undecided')
  })
})
