// write a test to assert that the embedded studio is running and can be visited

import {expect, test} from '@playwright/test'

test('should assert that the embedded studio is running and can be visited', async ({page}) => {
  await page.goto('/structure')
  await expect(page.getByText('Content')).toBeVisible({
    timeout: 30_000,
  })
})
