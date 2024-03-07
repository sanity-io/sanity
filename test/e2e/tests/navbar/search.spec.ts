import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('searching creates saved searches', async ({page, createDraftDocument, baseURL}) => {
  await createDraftDocument('/test/content/book')

  await page.getByTestId('field-title').getByTestId('string-input').fill('A searchable title')
  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A se')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  //search query should be saved
  const localStorage = await page.evaluate(() => window.localStorage)
  const keyMatch = Object.keys(localStorage).find((key) => key.startsWith('search::recent'))
  const savedSearches = JSON.parse(localStorage[keyMatch!]).recentSearches
  expect(savedSearches[0].terms.query).toBe('A se')

  //search query should be saved after browsing
  await page.goto('https://example.com')
  await page.goto(baseURL ?? '/test/content')
  const postNavigationLocalStorage = await page.evaluate(() => window.localStorage)
  const postNavigationSearches = JSON.parse(postNavigationLocalStorage[keyMatch!]).recentSearches
  expect(postNavigationSearches[0].terms.query).toBe('A se')

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

  const secondSearchStorage = await page.evaluate(() => window.localStorage)
  const secondSearches = JSON.parse(secondSearchStorage[keyMatch!]).recentSearches
  expect(secondSearches[0].terms.query).toBe('A searchable')
  expect(secondSearches[1].terms.query).toBe('A search')
  expect(secondSearches[2].terms.query).toBe('A se')
})
