import {expect} from '@playwright/test'

import {test} from '../../studio-test'
import {encodeQueryString, getVisionRegions, openVisionTool} from './utils'

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

    const {queryEditor, paramsEditor, paramsRegion, resultRegion} = await getVisionRegions(page)

    // Focus instead of clicking: in some responsive layouts the sticky Vision
    // header can overlap the editor hit area in Firefox and intercept pointer events.
    await queryEditor.focus()

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

    // Focus instead of clicking to avoid pointer interception from sticky header UI.
    await expect(queryEditor).toBeVisible()
    await expect(queryEditor).toBeEnabled()
    await queryEditor.focus()

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
    await expect(resultRegion.getByText(bookTitle)).toBeVisible()
    await expect(resultRegion.getByText(`documentId:${bookDocumentId}`)).toBeVisible()

    // Stop the listener
    await stopButton.click()
    await expect(listenButton).toBeVisible()
  })
})
