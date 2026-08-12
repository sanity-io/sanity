import {expect} from '@playwright/test'
import {uuid} from '@sanity/uuid'

import {test} from '../../studio-test'

const SEARCH_KEY = 'studio.search.recent'
const KEYVALUE_TIMEOUT = 30_000

test('searching creates unique saved searches', async ({
  page,
  createDraftDocument,
  sanityClient,
}) => {
  const dataset = sanityClient.config().dataset
  const documentId = await createDraftDocument('/content/book')
  // Unique title avoids colliding with other parallel shards / leftover docs.
  const uniqueTitle = `A searchable title ${uuid().slice(0, 8)}`

  // Clear any existing recent searches to ensure a clean test state
  try {
    await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
      method: 'DELETE',
    })
  } catch {
    // Key doesn't exist, which is fine - we want a clean state anyway
  }

  // Reload the page to ensure the browser picks up the cleared state
  await page.reload({waitUntil: 'load'})

  // create a document with a searchable title and wait for it to be saved
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')
  await expect(titleInput).toBeVisible({timeout: 30_000})
  await expect(titleInput).toBeEnabled()

  const mutateRequest = page.waitForResponse(
    (response) =>
      response.url().includes('/data/mutate/') &&
      response.request().method() === 'POST' &&
      response.ok(),
    {timeout: 30_000},
  )
  await titleInput.fill(uniqueTitle)
  await mutateRequest

  // Wait until the draft is queryable with the new title (search lag after mutate).
  await expect
    .poll(
      async () => {
        return sanityClient.fetch<string | null>(`*[_id == $id][0].title`, {
          id: `drafts.${documentId}`,
        })
      },
      {timeout: 30_000, intervals: [250, 500, 1_000]},
    )
    .toBe(uniqueTitle)

  const studioSearch = page.getByTestId('studio-search')
  const searchInput = page.getByPlaceholder('Search', {exact: true})
  const searchResults = page.getByTestId('search-results')

  // Helper to perform a search and click a result
  async function performSearch(query: string, optionName: string | RegExp) {
    await expect(studioSearch).toBeVisible()
    await studioSearch.click({force: true})
    await expect(searchInput).toBeVisible()
    await searchInput.fill(query)
    await expect(searchResults).toBeVisible()
    const option = searchResults.getByRole('option', {name: optionName}).first()
    // Search indexing can lag behind mutate visibility; poll the option.
    await expect(option).toBeVisible({timeout: 30_000})
    await option.click({force: true})
    // Wait for search dialog to close
    await expect(searchResults).not.toBeVisible()
  }

  function waitForKeyValuePut() {
    return page.waitForResponse(
      (response) =>
        response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT',
      {timeout: KEYVALUE_TIMEOUT},
    )
  }

  // First search: "A se"
  const keyValueRequest = waitForKeyValuePut()
  await performSearch('A se', /A searchable title/i)
  const responseBody = await (await keyValueRequest).json()

  // Verify the search was saved - check key and that most recent search is "A se"
  expect(responseBody[0].key).toBe(`${SEARCH_KEY}.${dataset}`)
  expect(responseBody[0].value.recentSearches[0].terms.query).toBe('A se')

  // search queries should stack, most recent first
  const keyValueRequest2 = waitForKeyValuePut()
  await performSearch('A search', /A searchable title/i)
  await keyValueRequest2

  const keyValueRequest3 = waitForKeyValuePut()
  await performSearch('A searchable', /A searchable title/i)
  await keyValueRequest3

  // Duplicate search
  const keyValueRequest4 = waitForKeyValuePut()
  await performSearch('A searchable', /A searchable title/i)
  const finalResponse = await (await keyValueRequest4).json()
  const {recentSearches} = finalResponse[0].value

  expect(recentSearches.length).toBe(3)
  expect(recentSearches[0].terms.query).toBe('A searchable')
  expect(recentSearches[1].terms.query).toBe('A search')
  expect(recentSearches[2].terms.query).toBe('A se')
})
