import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'

import {test} from '../fixtures/harFixture'
import {
  speciesDocumentNameASAP,
  speciesDocumentNameDraft,
  speciesDocumentNamePublished,
  speciesDocumentNameUndecided,
} from '../utils/__fixtures__/documents'
import {
  partialASAPReleaseMetadata,
  partialScheduledReleaseMetadata,
  partialUndecidedReleaseMetadata,
} from '../utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  discardVersion,
  getRandomReleaseId,
  skipIfBrowser,
} from '../utils/methods'

// for before all to work with single worker and run only once per tests and describe
// this is to avoid issues with multiple releases being created per test
test.describe.configure({mode: 'serial'})

test.describe('displayedDocument', () => {
  /** documents */
  let publishedDocument: SanityDocument
  let publishedDocumentDupe: SanityDocument

  /** versions */
  let publishedWithVersion: SanityDocument
  let versionDocumentOne: SanityDocument
  let versionDocumentTwo: SanityDocument
  let multipleVersionsDocId: string
  let singleASAPVersionDocument: SanityDocument

  /** releases */
  let asapReleaseId: string
  let undecidedReleaseId: string

  test.beforeAll(async ({sanityClient, _testContext, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    /** Set up release Ids */
    asapReleaseId = getRandomReleaseId()
    undecidedReleaseId = getRandomReleaseId()

    /** Create Releases */

    await createRelease({
      sanityClient,
      dataset,
      releaseId: asapReleaseId,
      metadata: partialASAPReleaseMetadata,
    })

    await createRelease({
      sanityClient,
      dataset,
      releaseId: undecidedReleaseId,
      metadata: partialUndecidedReleaseMetadata,
    })

    /** Create Documents */
    publishedDocument = await createDocument(sanityClient, {
      ...speciesDocumentNamePublished,
      _id: `${_testContext.getUniqueDocumentId()}`,
    })

    singleASAPVersionDocument = await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${asapReleaseId}.${_testContext.getUniqueDocumentId()}`,
    })

    multipleVersionsDocId = _testContext.getUniqueDocumentId()

    versionDocumentOne = await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${asapReleaseId}.${multipleVersionsDocId}`,
    })

    versionDocumentTwo = await createDocument(sanityClient, {
      ...speciesDocumentNameUndecided,
      _id: `versions.${undecidedReleaseId}.${multipleVersionsDocId}`,
    })

    const publishedIdWithVersions = _testContext.getUniqueDocumentId()

    publishedDocumentDupe = await createDocument(sanityClient, {
      ...speciesDocumentNamePublished,
      _id: `${publishedIdWithVersions}`,
    })

    publishedWithVersion = await createDocument(sanityClient, {
      ...speciesDocumentNameASAP,
      _id: `versions.${asapReleaseId}.${publishedIdWithVersions}`,
    })
  })

  test.afterAll(async ({sanityClient, browserName}) => {
    skipIfBrowser(browserName)
    const dataset = sanityClient.config().dataset

    await Promise.all([
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: asapReleaseId}),
      archiveAndDeleteRelease({sanityClient, dataset, releaseId: undecidedReleaseId}),
    ])

    await sanityClient.delete(publishedDocument._id)
    await sanityClient.delete(publishedDocumentDupe._id)
    await discardVersion({sanityClient, dataset, versionId: publishedWithVersion._id})
    await discardVersion({sanityClient, dataset, versionId: singleASAPVersionDocument._id})
    await discardVersion({sanityClient, dataset, versionId: versionDocumentOne._id})
    await discardVersion({sanityClient, dataset, versionId: versionDocumentTwo._id})
  })

  test.describe('draft pinned - draft or published, no version', () => {
    test('draft, no publish, no version - shows draft', async ({
      page,
      sanityClient,
      _testContext,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      const customDraft = await createDocument(sanityClient, {
        ...speciesDocumentNameDraft,
        _id: `drafts.${_testContext.getUniqueDocumentId()}`,
      })

      await page.goto(`/test/content/species;${customDraft._id}?perspective=${asapReleaseId}`)

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
      await sanityClient.delete(customDraft._id)
    })

    test('draft, publish, no version - shows draft from published displayed', async ({
      page,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      test.slow()
      // specific document set up for this test in mind
      await page.goto(`/test/content/species;${publishedDocument._id}`)

      await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // chip
      await expect(page.getByTestId('document-header-Draft-chip')).toHaveAttribute('data-selected')

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
        'published',
      )
    })
  })

  test.describe('draft pinned - No draft, no publish, with version', () => {
    test(`single version - shows version displayed`, async ({page, browserName}) => {
      skipIfBrowser(browserName)
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

    test('multiple version - shows first version displayed', async ({page, browserName}) => {
      skipIfBrowser(browserName)

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

    test(`displayed document is read only`, async ({page, browserName}) => {
      test.slow()
      skipIfBrowser(browserName)
      // specific document set up for this test in mind
      await page.goto(`/test/content/species;${singleASAPVersionDocument._id}`)
      const input = page.getByTestId('field-name').getByTestId('string-input')
      // wait to load
      await expect(input).toBeVisible()

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
      const isReadonly = (await input.getAttribute('readonly')) !== null

      expect(isReadonly).toBe(true)
    })
  })

  test.describe('published pinned', () => {
    test('draft, publish, no version - shows draft displayed', async ({page, browserName}) => {
      test.slow()
      skipIfBrowser(browserName)

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

    test(`no draft, publish, single version - shows published displayed`, async ({
      page,
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

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

  test.describe('release pinned', () => {
    test('draft, no publish, no version - shows draft', async ({
      page,
      sanityClient,
      _testContext,
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

      const customDraft = await createDocument(sanityClient, {
        ...speciesDocumentNameDraft,
        _id: `drafts.${_testContext.getUniqueDocumentId()}`,
      })

      await page.goto(`/test/content/species;${customDraft._id}?perspective=${asapReleaseId}`)

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
      await sanityClient.delete(customDraft._id)
    })

    test('no draft, no publish, single same version as pinned - shows version', async ({
      page,
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

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
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

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
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

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
      browserName,
    }) => {
      test.slow()
      skipIfBrowser(browserName)

      const dataset = sanityClient.config().dataset

      const scheduledId = getRandomReleaseId()

      // create releases
      await createRelease({
        sanityClient,
        dataset,
        releaseId: scheduledId,
        metadata: partialScheduledReleaseMetadata,
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

      archiveAndDeleteRelease({sanityClient, dataset, releaseId: scheduledId})
    })
  })
})
