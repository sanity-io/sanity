/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/test'

import {createUniqueDocument, withDefaultClient} from '../../helpers'

withDefaultClient((context) => {
  test.describe.skip('sanity/structure: document inspectors', () => {
    test('open and close custom inspector', async ({page}) => {
      await page.goto('/test/content/input-debug;inspectorsTest;inspectors-test')

      const getCustomInspectorButton = () =>
        page.locator('[data-ui="StatusButton"][aria-label="Custom inspector"]')
      const getSelectedInspectorButton = () =>
        page.locator('[data-ui="StatusButton"][aria-label="Custom inspector"][data-selected]')
      const getInspectorPanel = () => page.locator('aside[data-ui="DocumentInspectorPanel"]')
      const getInspectorPanelHeading = () => getInspectorPanel().locator('h1')
      const getCloseInspectorButton = () =>
        page.locator('button[aria-label="Close custom inspector"]')

      // Click to open inspector
      await getCustomInspectorButton().click({timeout: 0})

      // Expect button to be selected and inspector to be visible
      await expect(getSelectedInspectorButton()).toBeVisible()
      await expect(getInspectorPanel()).toBeVisible()
      await expect(getInspectorPanelHeading()).toContainText('Custom inspector')

      // Click to close inspector
      await getCloseInspectorButton().click()

      expect(
        await getCustomInspectorButton().evaluate((el) => el.getAttribute('data-selected')),
      ).toBe(null)
    })

    test('open "Validation" inspector', async ({page}) => {
      // create published document
      const uniqueDoc = await createUniqueDocument(context.client, {_type: 'validationTest'})
      const id = uniqueDoc._id!

      // create draft document
      await createUniqueDocument(context.client, {
        _type: 'inspectorsTest',
        _id: `drafts.${id}`,
        name: 'Edited by e2e test runner',
      })

      await page.goto(`/test/content/input-debug;validationTest;${id}`)

      const getValidationButton = () =>
        page.locator('[data-ui="StatusButton"][aria-label="Validation"]')
      const getSelectedValidationButton = () =>
        page.locator('[data-ui="StatusButton"][aria-label="Validation"][data-selected]')
      const getInspectorPanel = () => page.locator('aside[data-ui="DocumentInspectorPanel"]')
      const getInspectorPanelHeading = () => getInspectorPanel().locator('h1')

      // Click to open inspector
      await getValidationButton().click({timeout: 0})

      // Expect button to be selected and inspector to be visible
      await expect(getSelectedValidationButton()).toBeVisible()
      await expect(getInspectorPanel()).toBeVisible()
      await expect(getInspectorPanelHeading()).toContainText('Validation')
    })

    test('open "Review changes" inspector', async ({page}) => {
      // create published document
      const uniqueDoc = await createUniqueDocument(context.client, {_type: 'inspectorsTest'})
      const id = uniqueDoc._id!

      // create draft document
      await createUniqueDocument(context.client, {
        _type: 'inspectorsTest',
        _id: `drafts.${id}`,
        name: 'Edited by e2e test runner',
      })

      await page.goto(`/test/content/input-debug;inspectorsTest;${id}`)

      const getReviewChangesButton = () => page.locator('[data-testid="review-changes-button"]')
      const getSelectedReviewChangesButton = () =>
        page.locator('[data-testid="review-changes-button"][data-selected]')
      const getInspectorPanel = () => page.locator('aside[data-ui="DocumentInspectorPanel"]')
      const getInspectorPanelHeading = () => getInspectorPanel().locator('h1')

      // Click to open inspector
      await getReviewChangesButton().click()

      // Expect button to be selected and inspector to be visible
      await expect(getSelectedReviewChangesButton()).toBeVisible()
      await expect(getInspectorPanel()).toBeVisible()
      await expect(getInspectorPanelHeading()).toContainText('Review changes')

      await context.client.delete(id)
    })
  })
})
