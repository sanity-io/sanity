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

    const {queryEditor, queryLines, paramsEditor, paramsRegion, resultRegion, fetchButton} =
      await getVisionRegions(page)

    // Click to focus the editor
    await queryEditor.click()

    // Type text into the CodeMirror editor
    const inputText = '*[_type == "book" && _id == $id]{_id, title}'
    await queryEditor.fill(inputText)

    // Assert that the text was correctly inserted
    await expect(queryLines).toHaveText([inputText])

    const paramsInputText = JSON.stringify({id: bookDocument._id})
    // Type text into the params editor
    await paramsEditor.fill(paramsInputText.slice(0, -2))
    // The parse error should be visible
    await expect(paramsRegion.getByTestId('vision-params-error')).toBeVisible()

    // Fill the params editor with the correct text
    await paramsEditor.fill(paramsInputText)
    // The parse error should not be visible
    await expect(paramsRegion.getByTestId('vision-params-error')).not.toBeVisible()
    // Assert that the text was correctly inserted
    await expect(paramsEditor).toHaveText(paramsInputText)

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

    const {queryEditor, queryLines, paramsEditor, resultRegion, queryEditorRegion} =
      await getVisionRegions(page)
    await queryEditorRegion.click()
    await queryEditor.focus()
    // // Paste the url into the query editor
    await page.keyboard.press('ControlOrMeta+V')

    // Assert that the text was correctly inserted
    await expect(queryLines).toHaveText([query])

    const paramsText = await paramsEditor.textContent()
    const parsedParams = JSON.parse(paramsText || '{}')
    expect(parsedParams).toHaveProperty('id', bookDocument._id)

    // The query executes automatically when a url is pasted, so it should have results
    // Assert that the results are visible
    // It should find the book document assert that by checking the title and the id
    await expect(resultRegion.getByText(bookTitle)).toBeVisible()
    await expect(resultRegion.getByText(bookDocument._id)).toBeVisible()
  })

  test('should be possible to fetch live', async ({page, _testContext, sanityClient}) => {
    const bookTitle = 'Test Book'
    const updatedBookTitle = 'Renamed Book'
    const bookDocumentId = _testContext.getUniqueDocumentId()
    await sanityClient.create({
      _type: 'book',
      title: bookTitle,
      _id: bookDocumentId,
    })
    await openVisionTool(page)

    const {queryEditor, queryLines, resultRegion, fetchButton, liveButton} =
      await getVisionRegions(page)

    // Click to focus the editor
    await expect(queryEditor).toBeVisible()
    await expect(queryEditor).toBeEnabled()
    await queryEditor.click()

    // Type text into the CodeMirror editor
    const inputText = `*[_type == "book" && _id == "${bookDocumentId}"]{_id, title}`
    await expect(queryEditor).toBeEnabled()
    await queryEditor.fill(inputText)
    // Assert that the text was correctly inserted. The `toHaveText` poll is the
    // real readiness signal that CodeMirror has committed the value to its
    // internal state; no arbitrary sleep is needed here.
    await expect(queryLines).toHaveText([inputText])

    // Live fetch fetches the last request again whenever the documents in its
    // result change, so the document has to be in a fetched result first
    await expect(fetchButton).toBeEnabled()
    await fetchButton.click()
    await expect(resultRegion.getByText(bookTitle)).toBeVisible({timeout: 30_000})

    // Turning live fetch on swaps the button to Stop live, and fetches nothing
    await expect(liveButton).toBeEnabled()
    await liveButton.click()
    await expect(liveButton).toHaveText('Stop live')
    // The label changes on click, before the Live Content API subscription has connected, and a
    // change made before then refetches nothing
    await expect(liveButton).toHaveAttribute('data-live-status', 'connected', {timeout: 30_000})

    await sanityClient.patch(bookDocumentId).set({title: updatedBookTitle}).commit()

    // The change fetches the query again
    await expect(resultRegion.getByText(updatedBookTitle)).toBeVisible({timeout: 30_000})

    // Stop live fetching
    await liveButton.click()
    await expect(liveButton).toHaveText('Live fetch')
  })
})
