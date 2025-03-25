import {expect} from '@playwright/test'

import {test} from '../fixtures/harFixture'

const SEARCH_KEY = 'studio.search.recent'
test('searching creates unique saved searches', async ({
  page,
  createDraftDocument,
  sanityClient,
}) => {
  const dataset = sanityClient.config().dataset
  await createDraftDocument('/test/content/book')

  const existingKeys = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
    uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
  })

  // If the value is not null there are existingKeys, delete them in that case
  if (existingKeys[0].value !== null) {
    // Clear the sort order
    await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${SEARCH_KEY}.${dataset}`,
      method: 'DELETE',
    })
  }

  // create a document with a searchable title and wait for it to be saved
  const postRequest = page.waitForResponse(async (response) => {
    // This is not very reliable but since we are between APIs
    // It's better not to hard code for now.
    return response.request().method() === 'POST'
  })
  await page.getByTestId('field-title').getByTestId('string-input').fill('A searchable title')
  await postRequest

  await page.getByTestId('studio-search').click()

  await page.getByPlaceholder('Search', {exact: true}).fill('A se')
  await page.getByTestId('search-results-BROKEN').isVisible()

  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page
    .getByTestId('search-results')
    .getByRole('option', {name: 'A Se'})
    .first()
    .click({force: true})
  const responseBody = await (await keyValueRequest).json()

  expect(responseBody[0]).toMatchObject({
    key: `${SEARCH_KEY}.${dataset}`,
    value: {
      recentSearches: [
        {
          terms: {
            query: 'A se',
          },
        },
      ],
    },
  })

  // search queries should stack, most recent first
  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('studio-search').click()
  await page.getByPlaceholder('Search', {exact: true}).fill('A search')
  await page.getByTestId('search-results').isVisible()
  await page
    .getByTestId('search-results')
    .getByRole('option', {name: 'A Search'})
    .first()
    .click({force: true})
  await keyValueRequest2

  const keyValueRequest3 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('studio-search').click()
  await page.getByPlaceholder('Search', {exact: true}).fill('A searchable')
  await page.getByTestId('search-results').isVisible()
  await page
    .getByTestId('search-results')
    .getByRole('option', {name: 'A Searchable'})
    .first()
    .click({force: true})
  await keyValueRequest3

  // Duplicate search
  const keyValueRequest4 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('studio-search').click()
  await page.getByPlaceholder('Search', {exact: true}).fill('A searchable')
  await page.getByTestId('search-results').isVisible()
  await page
    .getByTestId('search-results')
    .getByRole('option', {name: 'A Searchable'})
    .first()
    .click({force: true})
  const finalResponse = await (await keyValueRequest4).json()
  const {recentSearches} = finalResponse[0].value

  expect(recentSearches.length).toBe(3)
  expect(recentSearches[0].terms.query).toBe('A searchable')
  expect(recentSearches[1].terms.query).toBe('A search')
  expect(recentSearches[2].terms.query).toBe('A se')
})
