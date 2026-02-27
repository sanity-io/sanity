import {expect} from '@playwright/test'

import {test} from '../../../studio-test'
import {speciesDocumentNameASAP} from '../utils/__fixtures__/documents'
import {partialASAPReleaseMetadata} from '../utils/__fixtures__/releases'
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

test.describe('Unarchive ASAP', () => {
  test.skip()

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
      _id: `versions.${asapReleaseIdTestOne}.${versionDocumentId}`,
    })

    await page.goto(`/releases/${asapReleaseIdTestOne}`)
  })

  test.afterEach(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await archiveAndDeleteRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
  })

  // Archive -> Unarchive -> ASAP release
  test('Initially ASAP release type should be ASAP type', async ({page, sanityClient}) => {
    const dataset = sanityClient.config().dataset

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).toHaveText('As soon as possible')
  })

  // Once a release of any type of scheduled, the type should be changed to that, so when it's unarchived, the type should be scheduled
  // ASAP: Schedule -> Unscheduled -> Archive -> Unarchive -> Scheduled release
  test('Initially ASAP when set to a scheduled time, then archived and unarchived should be Scheduled release type', async ({
    page,
    sanityClient,
  }) => {
    const dataset = sanityClient.config().dataset

    await scheduleAndConfirmReleaseMenu({
      page,
      date: new Date(new Date().setMinutes(new Date().getMinutes() + 20)),
    })

    await unscheduleAndConfirmRelease({page})

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})
    await expect(page.getByTestId('retention-policy-card')).toBeVisible()

    await unarchiveRelease({sanityClient, dataset, releaseId: asapReleaseIdTestOne})

    // has unarchived
    await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()

    await expect(page.getByTestId('release-type-picker')).not.toHaveText('As soon as possible')
  })
})
