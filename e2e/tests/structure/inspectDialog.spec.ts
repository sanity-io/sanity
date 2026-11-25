import {expect} from '@playwright/test'

import {clearPreference, isPreferenceWrite} from '../../helpers/preferences'
import {test} from '../../studio-test'

const INSPECT_KEY = 'studio.structure-tool.inspect-view-mode'
const WAIT_OPTIONS = {timeout: 30000}

test('clicking inspect mode sets value in storage', async ({
  page,
  createDraftDocument,
  browserName,
  sanityClient,
}) => {
  test.slow(browserName === 'firefox')

  // Clear any existing inspect-view-mode key BEFORE the studio loads. The key
  // is stored per user (shared across CI runs) — if a previous run left it as
  // 'raw', the Raw JSON tab is already active, clicking it changes nothing, no
  // PUT is issued and the test times out.
  await clearPreference(sanityClient, INSPECT_KEY)

  // Create document and wait for it to be fully loaded
  await createDraftDocument('/content/book')
  await page.waitForLoadState('load', WAIT_OPTIONS)

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
  const preferenceWrite = page.waitForResponse(async (response) => {
    return isPreferenceWrite(response, INSPECT_KEY)
  })

  // Click Raw JSON tab
  await rawJsonTab.click()

  // Wait for and verify the response
  const preferenceResponse = await preferenceWrite
  const responseBody = await preferenceResponse.json()
  expect(responseBody).toMatchObject({
    key: INSPECT_KEY,
    value: 'raw',
  })

  // Set up listener for the second network request before clicking.
  // Match on the response body to avoid catching a late duplicate of the first PUT.
  const preferenceWrite2 = page.waitForResponse(async (response) => {
    if (!isPreferenceWrite(response, INSPECT_KEY)) {
      return false
    }
    try {
      const body = await response.json()
      return body?.value === 'parsed'
    } catch {
      return false
    }
  })

  // Click Parsed tab
  const parsedTab = page.getByRole('tab', {name: 'Parsed'})
  await parsedTab.waitFor({state: 'visible', ...WAIT_OPTIONS})
  await parsedTab.click()

  // Wait for and verify the second response
  const response2 = await preferenceWrite2
  const responseBody2 = await response2.json()
  expect(responseBody2).toMatchObject({
    key: INSPECT_KEY,
    value: 'parsed',
  })
})
