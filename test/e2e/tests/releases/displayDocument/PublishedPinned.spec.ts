import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'
import {test} from '@sanity/test'

import {
  archiveRelease,
  createRelease,
  deleteRelease,
  getRandomReleaseId,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from './../utils/methods'

test.describe('Published pinned version', () => {
  let publishedDocument: SanityDocument
  let publishedWithVersion: SanityDocument
  let asapReleaseId: string

  test.beforeAll(async ({sanityClient, _testContext}) => {
    const dataset = sanityClient.config().dataset

    publishedDocument = await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `${_testContext.getUniqueDocumentId()}`,
      _type: 'species',
      name: 'published',
    })

    // create release and create the published document with that version

    asapReleaseId = getRandomReleaseId()

    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseId,
      metadata: {
        title: 'ASAP Release A',
        description: '',
        releaseType: 'asap',
      },
    })

    const publishedIdWithVersions = _testContext.getUniqueDocumentId()

    await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `${publishedIdWithVersions}`,
      _type: 'species',
      name: 'published',
    })

    publishedWithVersion = await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `versions.${asapReleaseId}.${publishedIdWithVersions}`,
      _type: 'species',
      name: 'ASAP A',
    })
  })

  test.afterAll(async ({sanityClient}) => {
    const dataset = sanityClient.config().dataset

    await sanityClient.delete(publishedDocument._id)

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseId})

    await deleteRelease({sanityClient, dataset, releaseId: asapReleaseId})
  })

  test('draft, publish, no version - shows draft displayed', async ({page}) => {
    test.slow()
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${publishedDocument._id}?perspective=published`)

    // Wait for document to load
    await expect(page.getByTestId('document-header-Published-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Published-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      'published',
    )
  })

  test(`no draft, publish, single version - shows published displayed`, async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${publishedWithVersion._id}?perspective=published`)

    // wait to load
    await expect(page.getByTestId('document-header-Published-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Published-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      'published',
    )
  })
})
