import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {withDefaultClient} from '../../helpers'

withDefaultClient((context) => {
  test(`value can be changed after the document has been published`, async ({
    page,
    createDraftDocument,
  }) => {
    test.slow()

    // Create test documents to use as reference targets.
    await Promise.all(
      [
        {
          _type: 'author',
          _id: 'authorA',
          name: 'Author A',
        },
        {
          _type: 'author',
          _id: 'authorB',
          name: 'Author B',
        },
      ].map((document) => context.client.createIfNotExists(document)),
    )

    await createDraftDocument('/test/content/book')

    // Reference fields don't seem to be given a test id, so this selection can't be more specific
    // at the moment e.g. `page.getByTestId('field-author')`.
    const referenceInput = page.getByTestId('reference-input')
    const paneFooter = page.getByTestId('pane-footer')
    const publishButton = page.getByTestId('action-Publish')
    const authorListbox = page.locator('#author-listbox')

    // Open the Author reference input.
    await referenceInput.getByLabel('Open').click()
    await expect(authorListbox).toBeVisible()

    // Select the first document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Wait for the document to be published.
    publishButton.click()
    await expect(paneFooter).toContainText('Published just now')

    // Open the Author reference input.
    await page.locator('#author-menuButton').click()
    await page.getByRole('menuitem').getByText('Replace').click()
    await referenceInput.getByLabel('Open').click()
    await expect(authorListbox).toBeVisible()

    // Select the next document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(paneFooter).toContainText('Saved')

    // Wait for the document to be published.
    publishButton.click()
    await expect(paneFooter).toContainText('Published just now')
  })
})

test.describe('search strategy', () => {
  test('uses Text Search API search strategy if filter is supported', async ({
    page,
    createDraftDocument,
  }) => {
    const referenceInput = page
      .locator('[data-comments-field-id="multiTypeRef"]')
      .getByTestId('reference-input')

    await createDraftDocument('/test/content/input-standard;referenceTest')

    // Wait for Text Search API request.
    const searchRequest = page.waitForRequest(
      (request) =>
        request.url().includes('sanity.studio.search.reference') &&
        request.url().includes('data/textsearch') &&
        request.postDataJSON().query.string == '*',
    )

    // Open the Author reference input.
    await referenceInput.getByLabel('Open').click()
    await searchRequest
  })

  test('falls back to GROQ Query API search strategy if filter is not supported by Text Search API', async ({
    page,
    createDraftDocument,
  }) => {
    const referenceInput = page
      .locator('[data-comments-field-id="referenceWithSubqueryFilter"]')
      .getByTestId('reference-input')

    await createDraftDocument('/test/content/input-standard;referenceTest')

    // Wait for GROQ Query API request.
    const searchRequest = page.waitForRequest(
      (request) =>
        request.url().includes('sanity.studio.search.reference') &&
        request.url().includes('data/query') &&
        request.url().includes('author-%3Ename+match+%22*e*%22'),
    )

    // Open the Author reference input.
    await referenceInput.getByLabel('Open').click()
    await searchRequest
  })
})
