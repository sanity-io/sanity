import {test, expect} from '@playwright/test'
import {createUniqueDocument, testSanityClient} from '../../helpers'

test.describe.skip('sanity/desk: document inspectors', () => {
  test('open and close custom inspector', async ({page}) => {
    await page.goto('/test/content/input-debug;inspectorsTest;inspectors-test')

    // Click to open inspector
    await page
      .locator('[data-ui="StatusButton"][aria-label="Custom inspector"]')
      .click({timeout: 0})

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
    // create published document
    const uniqueDoc = await createUniqueDocument({_type: 'validationTest'})
    const id = uniqueDoc._id!

    // create draft document
    await createUniqueDocument({
      _type: 'inspectorsTest',
      _id: `drafts.${id}`,
      name: 'Edited by e2e test runner',
    })

    await page.goto(`/test/content/input-debug;validationTest;${id}`)

    // Click to open inspector
    await page.locator('[data-ui="StatusButton"][aria-label="Validation"]').click({timeout: 0})

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
    // create published document
    const uniqueDoc = await createUniqueDocument({_type: 'inspectorsTest'})
    const id = uniqueDoc._id!

    // create draft document
    await createUniqueDocument({
      _type: 'inspectorsTest',
      _id: `drafts.${id}`,
      name: 'Edited by e2e test runner',
    })

    await page.goto(`/test/content/input-debug;inspectorsTest;${id}`)

    // Click to open inspector
    await page.locator('[data-testid="review-changes-button"]').click()

    // Expect button to be selected and inspector to be visible
    await expect(page.locator('[data-testid="review-changes-button"][data-selected]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"]')).toBeVisible()
    await expect(page.locator('aside[data-ui="DocumentInspectorPanel"] h1')).toContainText(
      'Review changes'
    )

    await testSanityClient.delete(id)
  })
})
