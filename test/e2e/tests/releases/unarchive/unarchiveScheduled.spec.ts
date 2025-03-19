import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialScheduledReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  archiveRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  unarchiveRelease,
} from '../utils/methods'

// skip firefox due to flakyness
const SKIP_BROWSERS = ['firefox']
const skipIfBrowser = (browserName: string) => {
  test.skip(SKIP_BROWSERS.includes(browserName), `Skip ${browserName} due to flakiness`)
}
test.describe('Unarchive Scheduled', () => {
  const scheduledReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: scheduledReleaseIdTestOne,
      metadata: partialScheduledReleaseMetadata,
    })
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await Promise.all([
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: scheduledReleaseIdTestOne}),
    ])
  })

  // Archive -> Unarchive -> Scheduled release
  test('Initially scheduled release should be scheduled release type when unarchived', async ({
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
      _id: `versions.${scheduledReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${scheduledReleaseIdTestOne}`)

    await archiveRelease({sanityClient, dataset, releaseId: scheduledReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: scheduledReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    const formattedScheduledReleaseDate = new Date(
      partialScheduledReleaseMetadata.intendedPublishAt,
    ).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) // example Mar 20, 2025
    const formattedScheduledReleaseTime = new Date(
      partialScheduledReleaseMetadata.intendedPublishAt,
    ).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) // example 10:00:00 AM or 1:00:00 PM

    await expect(page.getByTestId('release-type-picker')).toHaveText(
      `${formattedScheduledReleaseDate}, ${formattedScheduledReleaseTime}`,
    )
  })
})
