import {expect} from '@playwright/test'

import {test} from '../fixtures/harFixture'

const INSPECT_KEY = 'studio.structure-tool.inspect-view-mode'

test('clicking inspect mode sets value in storage', async ({page, createDraftDocument}) => {
  await createDraftDocument('/test/content/book')
  await page.getByTestId('document-pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: /Inspect/i}).click()

  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByRole('tab', {name: 'Raw JSON'}).click()
  const responseBody = await (await keyValueRequest).json()

  expect(responseBody[0]).toMatchObject({
    key: INSPECT_KEY,
    value: 'raw',
  })

  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByRole('tab', {name: 'Parsed'}).click()
  const responseBody2 = await (await keyValueRequest2).json()

  expect(responseBody2[0]).toMatchObject({
    key: INSPECT_KEY,
    value: 'parsed',
  })
})
