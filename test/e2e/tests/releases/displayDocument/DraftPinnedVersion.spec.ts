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

test.describe('No draft, no publish, with version', () => {
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
  test(`single version - shows version displayed`, async ({page}) => {
    test.slow()
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${singleASAPVersionDocument._id}`)
    const versionChip = page.getByTestId('document-header-ASAP-Release-A-chip')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(versionChip).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chilp
    await expect(page.getByTestId('document-header-Draft-chip')).toBeDisabled()

    await expect(versionChip).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
  })

  test('multiple version - shows first version displayed', async ({page}) => {
    test.slow()
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${multipleVersionsDocId}`)
    const asapChip = page.getByTestId('document-header-ASAP-Release-A-chip')
    const undecidedChip = page.getByTestId('document-header-Undecided-Release-A-chip')

    // Wait for document to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(asapChip).toBeVisible()
    await expect(undecidedChip).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).toBeDisabled()
    await expect(asapChip).toHaveAttribute('data-selected')
    await expect(undecidedChip).not.toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
  })

  test(`displayed document is read only`, async ({page}) => {
    test.slow()
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${singleASAPVersionDocument._id}`)

    // wait to load
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
    await expect(
      page.getByTestId('field-name').getByTestId('string-input').isDisabled(),
    ).toBeTruthy()
  })
})
