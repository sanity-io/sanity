import {expect} from '@playwright/test'

import {test} from '../fixtures/harFixture'

const SORT_KEY = 'studio.structure-tool.sort-order.author'
const CUSTOM_SORT_KEY = 'studio.structure-tool.sort-order.book'
const LAYOUT_KEY = 'studio.structure-tool.layout.author'

//we should also check for custom sort orders
test('clicking default sort order and direction sets value in storage', async ({
  page,
  sanityClient,
  browserName,
}) => {
  // For now, only test in Chromium due to flakiness in Firefox and WebKit
  test.skip(browserName !== 'chromium')

  await page.goto('/test/content/author')

  const existingKeys = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
    uri: `/users/me/keyvalue/${SORT_KEY}`,
  })

  // If the value is not null there are existingKeys, delete them in that case
  if (existingKeys[0].value !== null) {
    // Clear the sort order
    await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${SORT_KEY}`,
      method: 'DELETE',
    })
  }

  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Name'}).click()
  const responseBody = await (await keyValueRequest).json()

  expect(responseBody[0]).toMatchObject({
    key: SORT_KEY,
    value: {
      by: [{field: 'name', direction: 'asc'}],
      extendedProjection: 'name',
    },
  })

  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Last Edited'}).click()
  const responseBody2 = await (await keyValueRequest2).json()

  expect(responseBody2[0]).toMatchObject({
    key: SORT_KEY,
    value: {
      by: [{field: '_updatedAt', direction: 'desc'}],
      extendedProjection: '',
    },
  })
})

test('clicking custom sort order and direction sets value in storage', async ({
  page,
  browserName,
  sanityClient,
}) => {
  // For now, only test in Chromium due to flakiness in Firefox and WebKit
  test.skip(browserName !== 'chromium')

  await page.goto('/test/content/book')

  const existingKeys = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
    uri: `/users/me/keyvalue/${CUSTOM_SORT_KEY}`,
  })

  // If the value is not null there are existingKeys, delete them in that case
  if (existingKeys[0].value !== null) {
    // Clear the sort order
    await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${CUSTOM_SORT_KEY}`,
      method: 'DELETE',
    })
  }

  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Title'}).click()
  const responseBody = await (await keyValueRequest).json()

  expect(responseBody[0]).toMatchObject({
    key: CUSTOM_SORT_KEY,
    value: {
      // located in dev/test-studio/schema/book.ts
      by: [
        {field: 'title', direction: 'asc'},
        {field: 'publicationYear', direction: 'asc'},
      ],
      extendedProjection: 'title, publicationYear',
    },
  })
})

test('clicking list view sets value in storage', async ({page, sanityClient}) => {
  await page.goto('/test/content/author')

  const existingKeys = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
    uri: `/users/me/keyvalue/${LAYOUT_KEY}`,
  })

  // If the value is not null there are existingKeys, delete them in that case
  if (existingKeys[0].value !== null) {
    // Clear the sort order
    await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${LAYOUT_KEY}`,
      method: 'DELETE',
    })
  }

  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Detailed view'}).click()
  const responseBody = await (await keyValueRequest).json()

  expect(responseBody[0]).toMatchObject({
    key: LAYOUT_KEY,
    value: 'detail',
  })

  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Compact view'}).click()
  const responseBody2 = await (await keyValueRequest2).json()

  expect(responseBody2[0]).toMatchObject({
    key: LAYOUT_KEY,
    value: 'default',
  })
})
