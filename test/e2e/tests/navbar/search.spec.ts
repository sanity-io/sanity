import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('searching creates saved searches', async ({page, createDraftDocument, baseURL}) => {
  await createDraftDocument('/test/content/book')
  await page.getByTestId('field-title').getByTestId('string-input').fill('A searchable title')
  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A search')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  const localStorage = await page.evaluate(() => window.localStorage)
  const keyMatch = Object.keys(localStorage).find((key) => key.startsWith('search::recent'))
  const savedSearches = JSON.parse(localStorage[keyMatch!]).recentSearches
  expect(savedSearches[0].terms.query).toBe('A search')

  await page.goto('https://example.com')
  await page.goto(baseURL ?? '/test/content')
  const postNavigationLocalStorage = await page.evaluate(() => window.localStorage)

  //also include going to other studio / project id?
  const postNavigationSearches = JSON.parse(postNavigationLocalStorage[keyMatch!]).recentSearches
  expect(postNavigationSearches[0].terms.query).toBe('A search')

  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A searchable')
  await page.getByTestId('search-results').isVisible()
  await page.getByTestId('search-results').click()

  const secondSearchStorage = await page.evaluate(() => window.localStorage)

  const secondSearches = JSON.parse(secondSearchStorage[keyMatch!]).recentSearches
  expect(secondSearches[0].terms.query).toBe('A searchable')
})
