import {type Locator, type Page, expect} from '@playwright/test'

import {withDefaultClient} from '../../helpers'
import {expectPublishedStatus, expectSavedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

/**
 * Search for a reference and wait for a specific option to appear.
 * Retries the search by clearing and re-typing the query if the option doesn't appear,
 * which handles eventual consistency in the search index on fresh datasets.
 */
async function searchAndSelectReference(
  page: Page,
  autocomplete: Locator,
  popover: Locator,
  searchText: string,
  optionSelector: string,
  {timeout = 30_000}: {timeout?: number} = {},
) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    await autocomplete.click()
    await autocomplete.fill(searchText)
    await expect(popover).toBeVisible()

    // Wait briefly for results to appear
    try {
      await expect(page.locator(optionSelector)).toBeVisible({
        timeout: 10_000,
      })
      // Option found, click it
      await page.locator(optionSelector).click()
      return
    } catch {
      // Option not found yet — retry the search.
      // Clear the input to trigger a fresh search on next iteration.
      await autocomplete.clear()
      // Brief pause before retrying to let the search index catch up
      await page.waitForTimeout(2_000)
    }
  }
  // Final attempt — let it throw the regular assertion error if it still fails
  await autocomplete.click()
  await autocomplete.fill(searchText)
  await expect(page.locator(optionSelector)).toBeVisible({timeout: 10_000})
  await page.locator(optionSelector).click()
}

withDefaultClient((context) => {
  test(`value can be changed after the document has been published`, async ({
    page,
    createDraftDocument,
    browserName,
  }) => {
    // Skip Firefox due to flaky publish operation timing
    test.skip(browserName === 'firefox')
    test.slow()

    // Create test documents to use as reference targets.
    await Promise.all(
      [
        {
          _type: 'author',
          _id: 'authorA',
          name: 'Author A',
        },
        {
          _type: 'author',
          _id: 'authorB',
          name: 'Author B',
        },
      ].map((document) => context.client.createIfNotExists(document)),
    )

    await createDraftDocument('/content/book')

    // Reference fields don't seem to be given a test id, so this selection can't be more specific
    // at the moment e.g. `page.getByTestId('field-author')`.
    const paneFooter = page.getByTestId('pane-footer')
    const publishButton = page.getByTestId('action-publish')
    const popover = page.getByTestId('autocomplete-popover')
    const autocomplete = page.getByTestId('autocomplete')

    await expect(autocomplete).toBeVisible()

    // Search and select Author A. Uses retry logic to handle search index
    // eventual consistency on fresh datasets.
    await searchAndSelectReference(
      page,
      autocomplete,
      popover,
      'Author A',
      '#author-option-authorA',
      {timeout: 60_000},
    )

    // wait for the edit to finish
    await expectSavedStatus(paneFooter, {timeout: 30_000})

    // Wait for the document to be published.
    await expect(publishButton).toBeVisible()
    await expect(publishButton).toBeEnabled()
    await publishButton.click()
    await expectPublishedStatus(paneFooter, {timeout: 30_000})

    // Open the Author reference input.
    await page.locator('#author-menuButton').click()
    await page.getByRole('menuitem').getByText('Replace').click()

    await expect(autocomplete).toBeVisible()

    // Search and select Author B
    await searchAndSelectReference(
      page,
      autocomplete,
      popover,
      'Author B',
      '#author-option-authorB',
      {timeout: 60_000},
    )

    await expect(paneFooter).toContainText('Saved', {timeout: 30_000})

    // wait for the edit to finish
    await expectSavedStatus(paneFooter, {timeout: 30_000})

    // Wait for the document to be published.
    await expect(publishButton).toBeVisible()
    await expect(publishButton).toBeEnabled()
    await publishButton.click()
    await expectPublishedStatus(paneFooter, {timeout: 30_000})
  })

  test(`_strengthenOnPublish and _weak properties exist when adding reference to a draft document`, async ({
    page,
    createDraftDocument,
    browserName,
  }) => {
    test.skip(browserName === 'firefox' || browserName === 'chromium')
    test.slow()
    const originalTitle = 'Initial Doc'

    await createDraftDocument('/content/input-standard;referenceTest')
    await page.getByTestId('string-input').fill(originalTitle)

    await expect(
      page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton'),
    ).toBeVisible()
    /** create reference */
    await page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton').click()

    // Wait for the new document referenced to be created & loaded
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // switch to original doc
    await page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    // open the context menu
    const documentPane = page.getByTestId('document-pane')
    await documentPane.getByTestId('pane-context-menu-button').first().click()
    await page.getByTestId('action-inspect').click()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('aliasRef._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).toBeVisible()
    await expect(page.getByText('aliasRef._weak_weak:true')).toBeVisible()
  })

  // TODO: This test has been skipped because the release `r56VOgCmW` consistently cannot be found
  //       when the test is run in CI. This is despite CI using the same project, dataset, and API
  //       environment that is used when running the test locally. It is still useful, because it
  //       validates the behaviour when it is run locally. But we should get to the bottom of this
  //       and re-enable it.
  test.skip(`only _strengthenOnPublish (not _weak) properties exist when adding reference to a document in a release`, async ({
    page,
  }) => {
    test.slow()
    const originalTitle = 'Initial Doc'

    await page.goto(
      `/intent/create/template=referenceTest;type=referenceTest;version=r56VOgCmW/?perspective=r56VOgCmW`,
    )

    await page.getByTestId('string-input').fill(originalTitle)

    await expect(
      page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton'),
    ).toBeVisible()
    /** create reference */
    await page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton').click()

    // Wait for the new document referenced to be created & loaded
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // switch to original doc
    await page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    // open the context menu
    await page.getByTestId('pane-context-menu-button').first().click()
    await page.getByTestId('action-inspect').click()
    await expect(page.getByTestId('leaf-root')).toBeVisible()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('aliasRef._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).toBeVisible()
    await expect(
      page.getByTestId('leaf-root').getByText('aliasRef._weak_weak:true'),
    ).not.toBeVisible()
  })

  test(`_strengthenOnPublish and _weak properties are removed when the reference and document are published`, async ({
    page,
    createDraftDocument,
    browserName,
  }) => {
    test.skip(browserName === 'firefox' || browserName === 'chromium')
    // this is in a situation where the _strengthenOnPublish.weak is not set

    test.slow()
    const originalTitle = 'Initial Doc'
    const documentStatus = page.getByTestId('pane-footer-document-status')

    await createDraftDocument('/content/input-debug;simpleReferences')
    await page.getByTestId('string-input').fill(originalTitle)

    /** create reference */
    await expect(
      page.getByTestId('create-new-document-select-referenceField-selectTypeMenuButton'),
    ).toBeVisible()
    await page.getByTestId('create-new-document-select-referenceField-selectTypeMenuButton').click()

    // wait for the reference document to open
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // update and publish the reference
    await page.getByTestId('string-input').nth(1).fill('Reference test')
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText(
      'Reference test',
    )
    await page.getByTestId('action-publish').nth(1).click() // publish reference
    await expectPublishedStatus(documentStatus.nth(1))

    /** --- IN ORIGINAL DOC --- */
    await page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    await page.getByTestId('action-publish').first().click() // publish reference

    await expectPublishedStatus(documentStatus.first())

    // open the context menu
    await page.getByTestId('pane-context-menu-button').first().click()
    await page.getByTestId('action-inspect').click()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('referenceField._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).not.toBeVisible()
    await expect(page.getByText('referenceField._weak_weak:true')).not.toBeVisible()
  })

  test(`when reference is set to weak: true, it shouldn't strength on publish`, async ({
    page,
    createDraftDocument,
  }) => {
    // this is in a situation where the _strengthenOnPublish.weak is not set

    test.slow()
    const originalTitle = 'Initial Doc'
    const documentStatus = page.getByTestId('pane-footer-document-status')

    await createDraftDocument('/content/input-debug;simpleReferences')
    await expect(page.getByTestId('string-input')).toBeVisible()
    await page.getByTestId('string-input').fill(originalTitle)

    /** create reference */
    await expect(
      page.getByTestId('create-new-document-select-referenceFieldWeak-selectTypeMenuButton'),
    ).toBeVisible()
    await page
      .getByTestId('create-new-document-select-referenceFieldWeak-selectTypeMenuButton')
      .click()

    // wait for the reference document to open
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // update and publish the reference
    await page.getByTestId('string-input').nth(1).fill('Reference test')
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText(
      'Reference test',
    )
    await page.getByTestId('action-publish').nth(1).click() // publish reference
    await expectPublishedStatus(documentStatus.nth(1))

    /** --- IN ORIGINAL DOC --- */
    await page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    await page.getByTestId('action-publish').first().click() // publish reference

    await expectPublishedStatus(documentStatus.first())

    // open the context menu
    const documentPane = page.getByTestId('document-pane')
    await documentPane.getByTestId('pane-context-menu-button').first().click()
    await page.getByTestId('action-inspect').click()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('referenceField._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).not.toBeVisible()
    await expect(page.getByText('referenceFieldWeak._weak_weak')).toBeVisible()
  })
})
