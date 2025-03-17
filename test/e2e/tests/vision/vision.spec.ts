import {expect} from '@playwright/test'
import {test} from '@sanity/test'

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
    await page.locator('button').filter({hasText: 'Fetch'}).click()

    // Assert that the results are visible
    // It should find the book document assert that by checking the title and the id
    await expect(resultRegion.getByText(bookTitle)).toBeVisible()
    await expect(resultRegion.getByText(bookDocument._id)).toBeVisible()
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
      navigator.clipboard.writeText(text)
    }, url)

    const {queryEditor, paramsEditor, resultRegion, queryEditorRegion} =
      await getVisionRegions(page)
    await queryEditorRegion.click()
    await queryEditor.focus()
    // Paste the url into the query editor
    await page.keyboard.press('Meta+V')
    // Assert that the text was correctly inserted
    await expect(queryEditor).toHaveText(query)

    const paramsText = await paramsEditor.textContent()
    const parsedParams = JSON.parse(paramsText || '{}')
    expect(parsedParams).toHaveProperty('id', bookDocument._id)

    // The query executes automatically when a url is pasted, so it should have results
    // Assert that the results are visible
    // It should find the book document assert that by checking the title and the id
    await expect(resultRegion.getByText(bookTitle)).toBeVisible({
      timeout: 10_000,
    })
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
    await queryEditor.click()

    // Type text into the CodeMirror editor
    const inputText = `*[_type == "book" && _id == "${bookDocumentId}"]`
    await queryEditor.fill(inputText)
    // Assert that the text was correctly inserted
    await expect(queryEditor).toHaveText(inputText)

    // sleep for a bit so the text is part of the query, there is nothing in the ui to show that the text has been inserted
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Find the button with the text "Fetch" and click it.
    await page.locator('button').filter({hasText: 'Listen'}).click()

    // Wait until the listener is active
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await sanityClient.create({
      _type: 'book',
      title: bookTitle,
      _id: bookDocumentId,
    })

    // Assert that the results are visible
    await expect(resultRegion.getByText(bookTitle)).toBeVisible()
    await expect(resultRegion.getByText(`documentId:${bookDocumentId}`)).toBeVisible()

    // Stop the listener
    await page.locator('button').filter({hasText: 'Stop'}).click()
    await expect(page.locator('button').filter({hasText: 'Listen'})).toBeVisible()
  })
})
