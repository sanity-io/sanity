import {expect} from '@playwright/test'
import {test} from '@sanity/test'

//we should also check for custom sort orders`
test('clicking sort order and direction sets value in storage', async ({page}) => {
  await page.goto('/test/content/author')
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Name'}).click()
  const localStorage = await page.evaluate(() => window.localStorage)

  expect(localStorage['structure-tool::author::sortOrder']).toBe(
    '{"by":[{"field":"name","direction":"asc"}],"extendedProjection":"name"}',
  )

  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Last Edited'}).click()
  const lastEditedLocalStorage = await page.evaluate(() => window.localStorage)

  expect(lastEditedLocalStorage['structure-tool::author::sortOrder']).toBe(
    '{"by":[{"field":"_updatedAt","direction":"desc"}],"extendedProjection":""}',
  )
})

test('clicking list view sets value in storage', async ({page}) => {
  await page.goto('/test/content/author')
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Detailed view'}).click()
  const localStorage = await page.evaluate(() => window.localStorage)

  expect(localStorage['structure-tool::author::layout']).toBe('"detail"')

  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Compact view'}).click()
  const compactLocalStorage = await page.evaluate(() => window.localStorage)

  expect(compactLocalStorage['structure-tool::author::layout']).toBe('"default"')
})

test('values persist after navigating away and back', async ({page}) => {
  await page.goto('/test/content/author')
  await page.getByTestId('pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Detailed view'}).click()
  await page.goto('https://example.com')
  await page.goto('/test/content/author')
  const localStorage = await page.evaluate(() => window.localStorage)

  expect(localStorage['structure-tool::author::layout']).toBe('"detail"')
})
