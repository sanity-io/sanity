import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const SEARCH_KEY = 'studio.search.recent'
test('searching creates saved searches', async ({
  page,
  createDraftDocument,
  baseURL,
  sanityClient,
}) => {
  const {dataset} = sanityClient.config()
  await createDraftDocument('/test/content/book')

  await page.getByTestId('field-title').getByTestId('string-input').fill('A searchable title')
  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A se')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  //search query should be saved
  const savedSearches = await sanityClient
    .request({
      uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
      withCredentials: true,
    })
    .then((res) => res.recentSearches)
  expect(savedSearches[0].terms.query).toBe('A se')

  //search should save multiple queries
  await page.getByTestId('studio-search').click()
  await page.getByPlaceholder('Search', {exact: true}).fill('A search')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  //search queries should stack, most recent first
  await page.getByTestId('studio-search').click()
  await page.getByPlaceholder('Search', {exact: true}).fill('A searchable')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  const secondSearches = await sanityClient
    .request({
      uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
      withCredentials: true,
    })
    .then((res) => res.recentSearches)
  expect(secondSearches[0].terms.query).toBe('A searchable')
  expect(secondSearches[1].terms.query).toBe('A search')
  expect(secondSearches[2].terms.query).toBe('A se')
})
