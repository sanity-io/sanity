import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialASAPReleaseMetadata} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  archiveRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  unarchiveRelease,
} from '../utils/methods'
import {
  scheduleAndConfirmRelease,
  unscheduleAndConfirmRelease,
} from '../utils/release-detail-ui-methods'

// skip firefox due to flakyness
const SKIP_BROWSERS = ['firefox']
const skipIfBrowser = (browserName: string) => {
  test.skip(SKIP_BROWSERS.includes(browserName), `Skip ${browserName} due to flakiness`)
}
test.describe('Unarchive ASAP', () => {
  const asapReleaseIdTestOne: string = getRandomReleaseId()

  test.beforeEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseIdTestOne,
      metadata: partialASAPReleaseMetadata,
    })
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await Promise.all([
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne}),
    ])
  })

  // Archive -> Unarchive -> ASAP release
  test('Initially ASAP release type should be ASAP type', async ({
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
      _id: `versions.${asapReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${asapReleaseIdTestOne}`)

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).toHaveText('ASAP')
  })

  // Once a release of any type of scheduled, the type should be changed to that, so when it's unarchived, the type should be scheduled
  // ASAP: Schedule -> Unscheduled -> Archive -> Unarchive -> Scheduled release
  test('Initially ASAP when set to a scheduled time, then archived and unarchived should be Scheduled release type', async ({
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
      _id: `versions.${asapReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`test/releases/${asapReleaseIdTestOne}`)
    await scheduleAndConfirmRelease({page})

    await unscheduleAndConfirmRelease({page})

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})

    // has unarchived
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).not.toHaveText('ASAP')
  })
})
