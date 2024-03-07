import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const SORT_KEY = 'studio.structure-tool.sort-order.author'
const LAYOUT_KEY = 'studio.structure-tool.layout.author'

//we should also check for custom sort orders
test('clicking sort order and direction sets value in storage', async ({page, sanityClient}) => {
  await page.goto('/test/content/author')
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Name'}).click()
  const nameResult = await sanityClient.request({
    uri: `/users/me/keyvalue/${SORT_KEY}`,
    withCredentials: true,
  })
  expect(nameResult[0]).toMatchObject({
    key: SORT_KEY,
    value: {
      by: [{field: 'name', direction: 'asc'}],
      extendedProjection: 'name',
    },
  })

  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Last Edited'}).click()
  const lastEditedResult = await sanityClient.request({
    uri: `/users/me/keyvalue/${SORT_KEY}`,
    withCredentials: true,
  })

  expect(lastEditedResult[0]).toMatchObject({
    key: SORT_KEY,
    value: {
      by: [{field: '_updatedAt', direction: 'desc'}],
      extendedProjection: '',
    },
  })
})

test('clicking list view sets value in storage', async ({page, sanityClient}) => {
  await page.goto('/test/content/author')
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Detailed view'}).click()
  const detailResult = await sanityClient.request({
    uri: `/users/me/keyvalue/${LAYOUT_KEY}`,
    withCredentials: true,
  })
  expect(detailResult[0]).toMatchObject({
    key: LAYOUT_KEY,
    value: 'detail',
  })

  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Compact view'}).click()
  const compactResult = await sanityClient.request({
    uri: `/users/me/keyvalue/${LAYOUT_KEY}`,
    withCredentials: true,
  })
  expect(detailResult[0]).toMatchObject({
    key: LAYOUT_KEY,
    value: 'default',
  })
})
