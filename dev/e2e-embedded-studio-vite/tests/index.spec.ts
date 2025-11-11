// write a test to assert that the embedded studio is running and can be visited

import {expect, test} from '@playwright/test'

test('should assert that the embedded studio is running and can be visited', async ({
  page,
  browserName,
}, testInfo) => {
  testInfo.setTimeout(browserName === 'firefox' ? 90_000 : 30_000)
  await page.goto('/structure')
  await expect(page.getByText('Content')).toBeVisible({
    timeout: browserName === 'firefox' ? 90_000 : 30_000,
  })
})
