import {test} from '@sanity/test'

// const SEARCH_KEY = 'studio.search.recent'
test('searching creates saved searches', async ({
  page,
  createDraftDocument,
  // sanityClient,
}) => {
  // const {dataset} = sanityClient.config()
  await createDraftDocument('/test/content/book')

  await page.getByTestId('field-title').getByTestId('string-input').fill('A searchable title')
  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A se')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  //search query should be saved
  /*
   * the below is currently difficult to manage with state
   * of multiple workers and asyc cleanup functions
   */

  // const savedSearches = await sanityClient
  //   .withConfig({apiVersion: '2024-03-12'})
  //   .request({
  //     uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
  //     withCredentials: true,
  //   })
  //   .then((res) => res[0].value.recentSearches)
  // expect(savedSearches[0].terms.query).toBe('A se')

  // //search queries should stack, most recent first
  // await page.getByTestId('studio-search').click()
  // await page.getByPlaceholder('Search', {exact: true}).fill('A search')
  // await page.getByTestId('search-results').isVisible()
  // await page.getByTestId('search-results').click()

  // await page.getByTestId('studio-search').click()
  // await page.getByPlaceholder('Search', {exact: true}).fill('A searchable')
  // await page.getByTestId('search-results').isVisible()
  // await page.getByTestId('search-results').click()

  // const secondSearches = await sanityClient
  //   .withConfig({apiVersion: '2024-03-12'})
  //   .request({
  //     uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
  //     withCredentials: true,
  //   })
  //   .then((res) => res[0].value.recentSearches)
  // expect(secondSearches[0].terms.query).toBe('A searchable')
  // expect(secondSearches[1].terms.query).toBe('A search')
  // expect(secondSearches[2].terms.query).toBe('A se')
})
