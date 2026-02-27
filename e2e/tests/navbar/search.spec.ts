import {expect} from '@playwright/test'

import {test} from '../../studio-test'

const SEARCH_KEY = 'studio.search.recent'
test('searching creates unique saved searches', async ({
  page,
  createDraftDocument,
  sanityClient,
}) => {
  test.slow()

  const dataset = sanityClient.config().dataset
  await createDraftDocument('/content/book')

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

  const postRequest = page.waitForResponse(async (response) => {
    // This is not very reliable but since we are between APIs
    // It's better not to hard code for now.
    return response.request().method() === 'POST'
  })
  await titleInput.fill('A searchable title')
  await postRequest

  const studioSearch = page.getByTestId('studio-search')
  const searchInput = page.getByPlaceholder('Search', {exact: true})
  const searchResults = page.getByTestId('search-results')

  // Helper to perform a search and click a result
  async function performSearch(query: string, optionName: string) {
    await expect(studioSearch).toBeVisible()
    await studioSearch.click({force: true})
    await expect(searchInput).toBeVisible()
    await searchInput.fill(query)
    await expect(searchResults).toBeVisible()
    const option = searchResults.getByRole('option', {name: optionName}).first()
    await expect(option).toBeVisible()
    await option.click({force: true})
    // Wait for search dialog to close
    await expect(searchResults).not.toBeVisible()
  }

  // First search: "A se"
  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await performSearch('A se', 'A Se')
  const responseBody = await (await keyValueRequest).json()

  // Verify the search was saved - check key and that most recent search is "A se"
  expect(responseBody[0].key).toBe(`${SEARCH_KEY}.${dataset}`)
  expect(responseBody[0].value.recentSearches[0].terms.query).toBe('A se')

  // search queries should stack, most recent first
  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await performSearch('A search', 'A Search')
  await keyValueRequest2

  const keyValueRequest3 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await performSearch('A searchable', 'A Searchable')
  await keyValueRequest3

  // Duplicate search
  const keyValueRequest4 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await performSearch('A searchable', 'A Searchable')
  const finalResponse = await (await keyValueRequest4).json()
  const {recentSearches} = finalResponse[0].value

  expect(recentSearches.length).toBe(3)
  expect(recentSearches[0].terms.query).toBe('A searchable')
  expect(recentSearches[1].terms.query).toBe('A search')
  expect(recentSearches[2].terms.query).toBe('A se')
})
