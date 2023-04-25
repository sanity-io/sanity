import {test, expect} from '@playwright/test'

test.describe('sanity/desk: document inspectors', () => {
  test('open and close custom inspector', async ({page}) => {
    await page.goto('/test/content/input-debug;inspectorsTest;inspectors-test')

    // Click to open inspector
    await page.locator('[data-ui="StatusButton"][aria-label="Custom inspector"]').click()

    // Expect button to be selected and inspector to be visible
    await expect(
      page.locator('[data-ui="StatusButton"][aria-label="Custom inspector"][data-selected]')
    ).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"] h1')).toContainText(
      'Custom inspector'
    )

    // Click to close inspector
    await page.locator('button[aria-label="Close custom inspector"]').click()

    expect(
      await page
        .locator('[data-ui="StatusButton"][aria-label="Custom inspector"]')
        .evaluate((el) => el.getAttribute('data-selected'))
    ).toBe(null)
  })

  test('open "Validation" inspector', async ({page}) => {
    await page.goto('/test/content/input-debug;validationTest;validation-test')

    // Click to open inspector
    await page.locator('[data-ui="StatusButton"][aria-label="Validation"]').click()

    // Expect button to be selected and inspector to be visible
    await expect(
      page.locator('[data-ui="StatusButton"][aria-label="Validation"][data-selected]')
    ).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"] h1')).toContainText(
      'Validation'
    )
  })

  test('open "Review changes" inspector', async ({page}) => {
    await page.goto('/test/content/input-standard;stringsTest;strings-test')

    // Click to open inspector
    await page.locator('[data-testid="review-changes-button"]').click()

    // Expect button to be selected and inspector to be visible
    await expect(page.locator('[data-testid="review-changes-button"][data-selected]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"] h1')).toContainText(
      'Review changes'
    )
  })
})
