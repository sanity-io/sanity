import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'
import {test} from '@sanity/test'

import {
  archiveRelease,
  createRelease,
  deleteRelease,
  getRandomReleaseId,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from '../utils/methods'

test.describe('release pinned', () => {
  let asapReleaseId: string
  let undecidedReleaseId: string

  let multipleVersionsDocId: string
  let singleASAPVersionDocument: SanityDocument

  test.beforeAll(async ({sanityClient, _testContext}) => {
    const dataset = sanityClient.config().dataset

    asapReleaseId = getRandomReleaseId()
    undecidedReleaseId = getRandomReleaseId()

    // create releases
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

    await createRelease({
      sanityClient,
      dataset,
      releaseId: undecidedReleaseId,
      metadata: {
        title: 'Undecided Release A',
        description: '',
        releaseType: 'undecided',
      },
    })

    singleASAPVersionDocument = await sanityClient
      .withConfig(RELEASES_STUDIO_CLIENT_OPTIONS)
      .create({
        _id: `versions.${asapReleaseId}.${_testContext.getUniqueDocumentId()}`,
        _type: 'species',
        name: 'ASAP A',
      })

    multipleVersionsDocId = _testContext.getUniqueDocumentId()

    await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `versions.${asapReleaseId}.${multipleVersionsDocId}`,
      _type: 'species',
      name: 'ASAP A',
    })

    await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `versions.${undecidedReleaseId}.${multipleVersionsDocId}`,
      _type: 'species',
      name: 'Undecided A',
    })
  })

  test.afterAll(async ({sanityClient}) => {
    const dataset = sanityClient.config().dataset

    await archiveRelease({sanityClient, dataset, releaseId: asapReleaseId})
    await archiveRelease({sanityClient, dataset, releaseId: undecidedReleaseId})

    await deleteRelease({sanityClient, dataset, releaseId: asapReleaseId})
    await deleteRelease({sanityClient, dataset, releaseId: undecidedReleaseId})
  })

  test('draft, no publish, no version - shows draft', async ({
    page,
    sanityClient,
    _testContext,
  }) => {
    // specific document set up for this test in mind
    const draftDocument = await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `drafts.${_testContext.getUniqueDocumentId()}`,
      _type: 'species',
      name: 'draft',
    })

    await page.goto(`/test/content/species;${draftDocument._id}?perspective=${asapReleaseId}`)

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('draft')

    // clean up
    await sanityClient.delete(draftDocument._id)
  })

  test('no draft, no publish, single same version as pinned - shows version', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(
      `/test/content/species;${singleASAPVersionDocument._id}?perspective=${asapReleaseId}`,
    )

    const asapChip = page.getByTestId('document-header-ASAP-Release-A-chip')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(asapChip).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(asapChip).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
  })

  test('no draft, no publish, single different version as pinned - shows single existing document', async ({
    page,
  }) => {
    // specific document set up for this test in mind
    await page.goto(
      `/test/content/species;${singleASAPVersionDocument._id}?perspective=${asapReleaseId}`,
    )
    const asapChip = page.getByTestId('document-header-ASAP-Release-A-chip')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(asapChip).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(asapChip).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
  })

  test('no draft, no publish, multiple different versions, one of them is pinned - shows pinned version', async ({
    page,
  }) => {
    // specific document set up for this test in mind
    await page.goto(
      `/test/content/species;${multipleVersionsDocId}?perspective=${undecidedReleaseId}`,
    )
    const undecidedChip = page.getByTestId('document-header-Undecided-Release-A-chip')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(undecidedChip).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(undecidedChip).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      'Undecided A',
    )
  })

  test('no draft, no publish, multiple different versions, different version pinned - shows first version', async ({
    page,
    sanityClient,
  }) => {
    const dataset = sanityClient.config().dataset

    const scheduledId = getRandomReleaseId()

    // create releases
    await createRelease({
      sanityClient,
      dataset,
      releaseId: scheduledId,
      metadata: {
        title: 'Scheduled Release A',
        description: '',
        releaseType: 'asap',
      },
    })

    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${multipleVersionsDocId}?perspective=${scheduledId}`)

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    const asapChip = page.getByTestId('document-header-ASAP-Release-A-chip')
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(asapChip).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')

    await archiveRelease({sanityClient, dataset, releaseId: scheduledId})
    await deleteRelease({sanityClient, dataset, releaseId: scheduledId})
  })
})
