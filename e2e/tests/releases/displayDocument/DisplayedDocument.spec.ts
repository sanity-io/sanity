import {expect, type Page} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'

import {test} from '../../../studio-test'
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

/**
 * The document group inventory replaces the previous document perspective list/version chips.
 * It lists the document's existing variants (Published, Draft, releases) in a popover, with the
 * currently selected perspective marked via a `data-selected` attribute on the variant row.
 */
function getInventoryVariant(page: Page, variantName: string) {
  return page.getByTestId(`document-group-inventory-variant-${variantName.replaceAll(' ', '-')}`)
}

async function openDocumentGroupInventory(page: Page) {
  const inventoryButton = page.getByTestId('action-document-group-inventory')
  await expect(inventoryButton).toBeVisible()
  await inventoryButton.click()
  await expect(page.getByTestId('document-group-inventory')).toBeVisible()
}

/**
 * The inventory toggle button is labelled with the variant of the currently displayed document
 * (e.g. "Draft", "Published", or a release title).
 */
async function expectDisplayedVariantLabel(page: Page, label: string) {
  await expect(page.getByTestId('action-document-group-inventory')).toContainText(label)
}

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

    // Delete documents - using allSettled to handle documents that may not exist
    await Promise.allSettled([
      sanityClient.delete(publishedDocument._id),
      sanityClient.delete(publishedDocumentDupe._id),
      discardVersion({sanityClient, dataset, versionId: publishedWithVersion._id}),
      discardVersion({sanityClient, dataset, versionId: singleASAPVersionDocument._id}),
      discardVersion({sanityClient, dataset, versionId: versionDocumentOne._id}),
      discardVersion({sanityClient, dataset, versionId: versionDocumentTwo._id}),
    ])
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

      await page.goto(`/content/species;${customDraft._id}?perspective=${asapReleaseId}`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

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

      // specific document set up for this test in mind
      await page.goto(`/content/species;${publishedDocument._id}`)

      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: only the published variant exists, so it's the displayed document
      await expectDisplayedVariantLabel(page, 'Published')
      await openDocumentGroupInventory(page)
      await expect(getInventoryVariant(page, 'Published')).toBeVisible()

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
        'published',
      )
    })
  })

  test.describe('draft pinned - No draft, no publish, with version', () => {
    test(`single version - shows version displayed`, async ({page, browserName}) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(`/content/species;${singleASAPVersionDocument._id}`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
    })

    test('multiple version - shows first version displayed', async ({page, browserName}) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(`/content/species;${multipleVersionsDocId}`)

      // Wait for document to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: both version variants exist (no draft); the first one is the displayed document
      await expectDisplayedVariantLabel(page, 'ASAP Release A')
      await openDocumentGroupInventory(page)
      const asapVariant = getInventoryVariant(page, 'ASAP Release A')
      const undecidedVariant = getInventoryVariant(page, 'Undecided Release A')
      await expect(asapVariant).toBeVisible()
      await expect(undecidedVariant).toBeVisible()
      await expect(asapVariant).toHaveAttribute('data-selected')
      await expect(undecidedVariant).not.toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'Draft')).toHaveCount(0)

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
    })

    test(`displayed document is read only`, async ({page, browserName}) => {
      skipIfBrowser(browserName)
      // specific document set up for this test in mind
      await page.goto(`/content/species;${singleASAPVersionDocument._id}`)
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
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(`/content/species;${publishedDocument._id}?perspective=published`)

      // Wait for document to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: the published variant is the selected perspective and displayed document
      await expectDisplayedVariantLabel(page, 'Published')
      await openDocumentGroupInventory(page)
      await expect(getInventoryVariant(page, 'Published')).toHaveAttribute('data-selected')

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
        'published',
      )
    })

    test(`no draft, publish, single version - shows published displayed`, async ({
      page,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(`/content/species;${publishedWithVersion._id}?perspective=published`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: the published variant is the selected perspective and displayed document
      await expectDisplayedVariantLabel(page, 'Published')
      await openDocumentGroupInventory(page)
      await expect(getInventoryVariant(page, 'Published')).toHaveAttribute('data-selected')

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
      skipIfBrowser(browserName)

      const customDraft = await createDocument(sanityClient, {
        ...speciesDocumentNameDraft,
        _id: `drafts.${_testContext.getUniqueDocumentId()}`,
      })

      await page.goto(`/content/species;${customDraft._id}?perspective=${asapReleaseId}`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('draft')

      // clean up
      await sanityClient.delete(customDraft._id)
    })

    test('no draft, no publish, single same version as pinned - shows version', async ({
      page,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(
        `/content/species;${singleASAPVersionDocument._id}?perspective=${asapReleaseId}`,
      )

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: only the pinned version variant exists, and it's displayed/selected
      await expectDisplayedVariantLabel(page, 'ASAP Release A')
      await openDocumentGroupInventory(page)
      const asapVariant = getInventoryVariant(page, 'ASAP Release A')
      await expect(asapVariant).toBeVisible()
      await expect(asapVariant).toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'Draft')).toHaveCount(0)

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
    })

    test('no draft, no publish, single different version as pinned - shows single existing document', async ({
      page,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(
        `/content/species;${singleASAPVersionDocument._id}?perspective=${asapReleaseId}`,
      )

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: only the existing version variant is shown, and it's displayed/selected
      await expectDisplayedVariantLabel(page, 'ASAP Release A')
      await openDocumentGroupInventory(page)
      const asapVariant = getInventoryVariant(page, 'ASAP Release A')
      await expect(asapVariant).toBeVisible()
      await expect(asapVariant).toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'Draft')).toHaveCount(0)

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')
    })

    test('no draft, no publish, multiple different versions, one of them is pinned - shows pinned version', async ({
      page,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      // specific document set up for this test in mind
      await page.goto(`/content/species;${multipleVersionsDocId}?perspective=${undecidedReleaseId}`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: the pinned version variant is displayed/selected, the other version isn't
      await expectDisplayedVariantLabel(page, 'Undecided Release A')
      await openDocumentGroupInventory(page)
      const undecidedVariant = getInventoryVariant(page, 'Undecided Release A')
      await expect(undecidedVariant).toBeVisible()
      await expect(undecidedVariant).toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'ASAP Release A')).not.toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'Draft')).toHaveCount(0)

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
      await page.goto(`/content/species;${multipleVersionsDocId}?perspective=${scheduledId}`)

      // wait to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // inventory: the pinned release has no version, so the first existing version is displayed/selected
      await expectDisplayedVariantLabel(page, 'ASAP Release A')
      await openDocumentGroupInventory(page)
      const asapVariant = getInventoryVariant(page, 'ASAP Release A')
      await expect(asapVariant).toBeVisible()
      await expect(asapVariant).toHaveAttribute('data-selected')
      await expect(getInventoryVariant(page, 'Draft')).toHaveCount(0)

      // field
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue('ASAP A')

      await archiveAndDeleteRelease({sanityClient, dataset, releaseId: scheduledId})
    })

    test('no draft,  publish, one version with _system.delete shows published', async ({
      page,
      sanityClient,
      _testContext,
      browserName,
    }) => {
      skipIfBrowser(browserName)

      const documentId = _testContext.getUniqueDocumentId()
      const versionId = `versions.${asapReleaseId}.${documentId}`

      await createDocument(sanityClient, {
        ...speciesDocumentNamePublished,
        _id: documentId,
      })

      // Create a document with a version that has _system.delete set to true
      await createDocument(sanityClient, {
        ...speciesDocumentNameASAP,
        _id: versionId,
        _system: {
          delete: true,
        },
      })

      await page.goto(`/content/species;${documentId}?perspective=${asapReleaseId}`)

      // Wait for document to load
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

      // Check that the pinned version variant is selected in the inventory
      await openDocumentGroupInventory(page)
      const asapVariant = getInventoryVariant(page, 'ASAP Release A')
      await expect(asapVariant).toBeVisible()
      await expect(asapVariant).toHaveAttribute('data-selected')

      await expect(page.getByTestId('document-panel-document-title')).not.toHaveText('Untitled')
      // Check that the name field shows the version name
      await expect(page.getByTestId('document-panel-document-title')).toHaveText('(published)')
    })
  })
})
