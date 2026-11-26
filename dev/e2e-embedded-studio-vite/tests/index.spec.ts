// write a test to assert that the embedded studio is running and can be visited

import {expect, test} from '@playwright/test'

test('should assert that the embedded studio is running and can be visited', async ({
  page,
  browserName,
}, testInfo) => {
  testInfo.setTimeout(browserName === 'firefox' ? 90_000 : 30_000)
  await page.goto('/structure')
  // Exact match: mounted navbar menus keep "View Content Releases" in the DOM under @sanity/ui v4.
  await expect(page.getByText('Content', {exact: true})).toBeVisible({
    timeout: browserName === 'firefox' ? 90_000 : 30_000,
  })
})
