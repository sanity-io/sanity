import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialUndecidedReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  archiveRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  unarchiveRelease,
} from '../utils/methods'
import {
  scheduleAndConfirmReleaseMenu,
  unscheduleAndConfirmRelease,
} from '../utils/release-detail-ui-methods'

// skip firefox due to flakyness
const SKIP_BROWSERS = ['firefox']
const skipIfBrowser = (browserName: string) => {
  test.skip(SKIP_BROWSERS.includes(browserName), `Skip ${browserName} due to flakiness`)
}

test.describe('Unarchive Undecided', () => {
  const undecidedReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: undecidedReleaseIdTestOne,
      metadata: partialUndecidedReleaseMetadata,
    })
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await Promise.all([
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: undecidedReleaseIdTestOne}),
    ])
  })

  // Archive -> Unarchive -> Undecided release
  test('Initially Undecided release type should be ASAP type', async ({
    page,
    sanityClient,
    _testContext,
    browserName,
  }) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset
    const versionDocumentId = _testContext.getUniqueDocumentId()

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${undecidedReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${undecidedReleaseIdTestOne}`)

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
    _testContext,
    browserName,
  }) => {
    skipIfBrowser(browserName)

    test.slow()
    const dataset = sanityClient.config().dataset
    const versionDocumentId = _testContext.getUniqueDocumentId()

    await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${undecidedReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${undecidedReleaseIdTestOne}`)
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
