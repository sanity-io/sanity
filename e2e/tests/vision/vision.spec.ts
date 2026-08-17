import {expect} from '@playwright/test'

import {test} from '../../studio-test'
import {partialASAPReleaseMetadata} from '../releases/utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
} from '../releases/utils/methods'
import {
  createVariantDefinition,
  createVariantDocument,
  deleteVariantDefinition,
} from '../variants/utils'
import {
  encodeQueryString,
  fetchPublishedVariantOverlay,
  getVisionRegions,
  openVisionTool,
  runVisionQuery,
} from './utils'

// Variant overlay remaps `_id` to the published id, but a `_type == "book"`
// filter does not match those overlaid documents. Query by `_id` only.
const OVERLAY_QUERY = '*[_id == $id]{_id, title}'
// Stacked perspectives (release id + drafts) are rejected on the e2e studio's
// Vision default (`v2022-08-08`). `v2025-02-19` is a built-in Vision option.
const STACKED_PERSPECTIVE_API_VERSION = 'v2025-02-19'

test.describe('Vision', () => {
  test('should be possible to type an execute a query', async ({page, sanityClient}) => {
    const bookTitle = 'Test Book'
    const bookDocument = await sanityClient.create({
      _type: 'book',
      title: bookTitle,
    })

    await openVisionTool(page)
    // Clears local storage
    await page.evaluate(() => localStorage.clear())
    await page.getByTestId('perspective-selector').selectOption('raw')

    const {queryEditor, paramsEditor, paramsRegion, resultRegion} = await getVisionRegions(page)

    // Click to focus the editor
    await queryEditor.click()

    // Type text into the CodeMirror editor
    const inputText = '*[_type == "book" && _id == $id]{_id, title}'
    await queryEditor.fill(inputText)

    // Assert that the text was correctly inserted
    await expect(queryEditor).toHaveText(inputText)

    const paramsInputText = JSON.stringify({id: bookDocument._id})
    // Type text into the params editor
    await paramsEditor.fill(paramsInputText.slice(0, -2))
    // Error icon should be visible
    await expect(paramsRegion.locator('[data-sanity-icon="error-outline"]')).toBeVisible()

    // Fill the params editor with the correct text
    await paramsEditor.fill(paramsInputText)
    // Error icon should not be visible
    await expect(paramsRegion.locator('[data-sanity-icon="error-outline"]')).not.toBeVisible()
    // Assert that the text was correctly inserted
    await expect(paramsEditor).toHaveText(paramsInputText)

    // Find the button with the text "Fetch" and click it.
    const fetchButton = page.locator('button').filter({hasText: 'Fetch'})
    await expect(fetchButton).toBeVisible()
    await expect(fetchButton).toBeEnabled()
    await fetchButton.click()

    // Assert that the results are visible
    // It should find the book document assert that by checking the title and the id
    // Use longer timeout since query execution can take time
    await expect(resultRegion.getByText(bookTitle)).toBeVisible({timeout: 30_000})
    await expect(resultRegion.getByText(bookDocument._id)).toBeVisible({timeout: 10_000})
  })

  test('should be possible to paste and parse a query', async ({
    page,
    context,
    sanityClient,
    browserName,
  }) => {
    // Firefox doesn't support pasting from the clipboard
    test.skip(browserName === 'firefox')

    const bookTitle = 'Test Book'
    const bookDocument = await sanityClient.create({
      _type: 'book',
      title: bookTitle,
    })

    // Grant clipboard permissions before opening the page
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await openVisionTool(page)
    await page.getByTestId('perspective-selector').selectOption('raw')
    const query = `*[_type == "book" && _id == $id]{_id, title}`
    const params = {id: bookDocument._id}
    const url = sanityClient.getUrl(
      sanityClient.getDataUrl('query', encodeQueryString(query, params)),
    )
    await page.evaluate((text) => {
      return navigator.clipboard.writeText(text)
    }, url)

    const {queryEditor, paramsEditor, resultRegion, queryEditorRegion} =
      await getVisionRegions(page)
    await queryEditorRegion.click()
    await queryEditor.focus()
    // // Paste the url into the query editor
    await page.keyboard.press('ControlOrMeta+V')

    // Assert that the text was correctly inserted
    await expect(queryEditor).toHaveText(query)

    const paramsText = await paramsEditor.textContent()
    const parsedParams = JSON.parse(paramsText || '{}')
    expect(parsedParams).toHaveProperty('id', bookDocument._id)

    // The query executes automatically when a url is pasted, so it should have results
    // Assert that the results are visible
    // It should find the book document assert that by checking the title and the id
    await expect(resultRegion.getByText(bookTitle)).toBeVisible()
    await expect(resultRegion.getByText(bookDocument._id)).toBeVisible()
  })

  test('should be possible to listen to changes', async ({page, _testContext, sanityClient}) => {
    const bookTitle = 'Test Book'
    const bookDocumentId = _testContext.getUniqueDocumentId()
    await openVisionTool(page)
    // Clears local storage
    await page.evaluate(() => localStorage.clear())

    const {queryEditor, resultRegion} = await getVisionRegions(page)

    // Click to focus the editor
    await expect(queryEditor).toBeVisible()
    await expect(queryEditor).toBeEnabled()
    await queryEditor.click()

    // Type text into the CodeMirror editor
    const inputText = `*[_type == "book" && _id == "${bookDocumentId}"]`
    await expect(queryEditor).toBeEnabled()
    await queryEditor.fill(inputText)
    // Assert that the text was correctly inserted. The `toHaveText` poll is the
    // real readiness signal that CodeMirror has committed the value to its
    // internal state; no arbitrary sleep is needed here.
    await expect(queryEditor).toHaveText(inputText)

    // The Listen button is disabled until Vision has parsed the current query,
    // so waiting for `enabled` is the reliable readiness signal (replaces an
    // earlier arbitrary 1s sleep used to "let the text become part of the query").
    // Pin a Vision-local perspective so a parallel spec that sets the navbar
    // release/variant does not auto-switch this listener onto pinnedRelease.
    await page.getByTestId('perspective-selector').selectOption('raw')

    const listenButton = page.locator('button').filter({hasText: 'Listen'})
    await expect(listenButton).toBeVisible()
    await expect(listenButton).toBeEnabled()
    await listenButton.click()

    // Clicking Listen swaps the UI to a Stop button once the listener
    // subscription is established on the backend. Creating the document before
    // the Stop button appears races the listener setup and can cause the
    // document event to be missed entirely. Waiting for `Stop` is the
    // definitive "listener is active" readiness signal (replaces an earlier
    // arbitrary 1s sleep).
    const stopButton = page.locator('button').filter({hasText: 'Stop'})
    await expect(stopButton).toBeVisible()

    await sanityClient.create({
      _type: 'book',
      title: bookTitle,
      _id: bookDocumentId,
    })

    // Assert that the results are visible
    await expect(resultRegion.getByText(bookTitle)).toBeVisible({timeout: 30_000})
    await expect(resultRegion.getByText(`documentId:${bookDocumentId}`)).toBeVisible({
      timeout: 10_000,
    })

    // Stop the listener
    await stopButton.click()
    await expect(listenButton).toBeVisible()
  })

  test('queries the pinned release version of a document', async ({
    page,
    sanityClient,
    _testContext,
  }) => {
    const dataset = sanityClient.config().dataset
    const releaseId = getRandomReleaseId()
    const bookId = _testContext.getUniqueDocumentId()
    const publishedTitle = 'Published title'
    const releaseTitle = 'Release title'

    await createRelease({
      sanityClient,
      dataset,
      releaseId,
      metadata: {
        ...partialASAPReleaseMetadata,
        title: `Vision ${releaseId}`,
      },
    })

    try {
      await sanityClient.create({
        _id: bookId,
        _type: 'book',
        title: publishedTitle,
      })
      await createDocument(sanityClient, {
        _id: `versions.${releaseId}.${bookId}`,
        _type: 'book',
        title: releaseTitle,
      })

      await openVisionTool(page, `?perspective=${releaseId}`)
      await expect(page.getByTestId('perspective-selector')).toHaveValue('pinnedRelease')
      await expect(page.getByTestId('api-version-selector')).toBeEnabled()
      await page.getByTestId('api-version-selector').selectOption(STACKED_PERSPECTIVE_API_VERSION)
      await expect(page.getByTestId('api-version-selector')).toHaveValue(
        STACKED_PERSPECTIVE_API_VERSION,
      )

      const resultRegion = await runVisionQuery(page, OVERLAY_QUERY, {id: bookId})
      await expect(resultRegion.getByText(releaseTitle)).toBeVisible({timeout: 30_000})
      await expect(resultRegion.getByText(publishedTitle)).toHaveCount(0)

      const queryUrl = page.getByTestId('vision-query-url')
      await expect(queryUrl).toHaveValue(new RegExp(`[?&]perspective=[^&]*${releaseId}`))
    } finally {
      await archiveAndDeleteRelease({sanityClient, dataset, releaseId})
    }
  })

  test('queries with the navbar variant and locks the API version to vX', async ({
    page,
    sanityClient,
    _testContext,
  }) => {
    const variantId = `vis${getRandomReleaseId()}`
    const bookId = _testContext.getUniqueDocumentId()
    const publishedTitle = 'Published title'
    const variantTitle = 'Variant title'

    await sanityClient.create({
      _id: bookId,
      _type: 'book',
      title: publishedTitle,
    })
    await createVariantDefinition(sanityClient, {
      variantId,
      conditions: {audience: `vision-${variantId}`},
      metadata: {title: `Vision variant ${variantId}`},
    })

    try {
      await createVariantDocument(sanityClient, {
        variantId,
        publishedId: bookId,
        document: {_type: 'book', title: variantTitle},
      })
      await expect
        .poll(async () => {
          const result = await fetchPublishedVariantOverlay(sanityClient, {
            publishedId: bookId,
            variantId,
          })
          return result[0]?.title
        })
        .toBe(variantTitle)

      await openVisionTool(page, `?perspective=published&variant=${variantId}`)
      await expect(page.getByTestId('perspective-selector')).toHaveValue('pinnedRelease')

      const apiVersionSelector = page.getByTestId('api-version-selector')
      await expect(apiVersionSelector).toHaveValue('vX')
      await expect(apiVersionSelector).toBeDisabled()

      const resultRegion = await runVisionQuery(page, OVERLAY_QUERY, {id: bookId})
      const fetchButton = page.locator('button').filter({hasText: 'Fetch'})
      await expect
        .poll(
          async () => {
            if ((await resultRegion.getByText(variantTitle).count()) > 0) {
              return true
            }
            await expect(fetchButton).toBeEnabled()
            await fetchButton.click()
            return false
          },
          {intervals: [500, 1_000, 2_000]},
        )
        .toBe(true)
      await expect(resultRegion.getByText(publishedTitle)).toHaveCount(0)

      await page.getByTestId('api-version-selector-wrap').hover()
      await expect(
        page.getByText('When a variant is selected the API version needs to be vX'),
      ).toBeVisible()

      const queryUrl = page.getByTestId('vision-query-url')
      await expect(queryUrl).toHaveValue(/\/vX\//)
      await expect(queryUrl).toHaveValue(new RegExp(`[?&]variant=${variantId}`))

      await page.getByTestId('perspective-selector').selectOption('raw')
      await expect(apiVersionSelector).toBeEnabled()
      await expect(resultRegion.getByText(publishedTitle)).toBeVisible({timeout: 30_000})
      await expect(queryUrl).not.toHaveValue(/[?&]variant=/)
    } finally {
      await deleteVariantDefinition(sanityClient, variantId, {publishedId: bookId})
    }
  })
})
