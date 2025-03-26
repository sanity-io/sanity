import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const INSPECT_KEY = 'studio.structure-tool.inspect-view-mode'
const WAIT_OPTIONS = {timeout: 30000}

test('clicking inspect mode sets value in storage', async ({
  page,
  createDraftDocument,
  browserName,
}) => {
  test.slow(browserName === 'firefox')
  // Create document and wait for it to be fully loaded
  await createDraftDocument('/test/content/book')
  await page.waitForLoadState('load', WAIT_OPTIONS)

  const getDocumentPane = () => page.getByTestId('document-pane')
  const getPaneContextMenuButton = () => getDocumentPane().getByTestId('pane-context-menu-button')
  const getInspectMenuItem = () => page.getByRole('menuitem', {name: /Inspect/i})
  const getRawJsonTab = () => page.getByRole('tab', {name: 'Raw JSON'})

  await getPaneContextMenuButton().click()
  await getInspectMenuItem().click()

  // Open inspect dialog
  const contextMenuButton = page
    .getByTestId('document-pane')
    .getByTestId('pane-context-menu-button')
  await contextMenuButton.waitFor({state: 'visible', ...WAIT_OPTIONS})
  await contextMenuButton.click()

  const inspectMenuItem = page.getByRole('menuitem', {name: /Inspect/i})
  await inspectMenuItem.waitFor({state: 'visible', ...WAIT_OPTIONS})
  await inspectMenuItem.click()

  // Wait for inspect dialog to be visible
  const rawJsonTab = page.getByRole('tab', {name: 'Raw JSON'})
  await rawJsonTab.waitFor({state: 'visible', ...WAIT_OPTIONS})

  // Set up listener for the first network request before clicking
  const keyValueRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })
  await page.getByRole('tab', {name: 'Raw JSON'}).click()

  // Wait for and verify the response
  const keyValueResponse = await keyValueRequest
  const responseBody = await keyValueResponse.json()
  expect(responseBody[0]).toMatchObject({
    key: INSPECT_KEY,
    value: 'raw',
  })

  // Wait for the UI to stabilize
  await page.waitForTimeout(500)

  // Set up listener for the second network request
  const keyValueRequest2 = page.waitForResponse(async (response) => {
    return response.url().includes('/users/me/keyvalue') && response.request().method() === 'PUT'
  })

  // Click Parsed tab
  const parsedTab = page.getByRole('tab', {name: 'Parsed'})
  await parsedTab.waitFor({state: 'visible', ...WAIT_OPTIONS})
  await parsedTab.click()

  // Wait for and verify the second response
  const response2 = await keyValueRequest2
  const responseBody2 = await response2.json()
  expect(responseBody2[0]).toMatchObject({
    key: INSPECT_KEY,
    value: 'parsed',
  })
})
