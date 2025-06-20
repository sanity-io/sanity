import {expect} from '@playwright/test'

import {withDefaultClient} from '../../helpers/sanityClient'
import {expectEditedStatus, expectPublishedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

withDefaultClient((context) => {
  test(`value can be changed after the document has been published`, async ({
    page,
    createDraftDocument,
  }) => {
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
    const referenceInput = page.getByTestId('reference-input')
    const paneFooter = page.getByTestId('pane-footer')
    const publishButton = page.getByTestId('action-publish')
    const authorListbox = page.locator('#author-listbox')
    const popover = page.getByTestId('autocomplete-popover')

    // Open the Author reference input.
    await referenceInput.getByLabel('Open').click()
    await expect(popover).toBeVisible()
    await expect(authorListbox).toBeVisible()

    // Select the first document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // wait for the edit to finish
    await expectEditedStatus(paneFooter)

    // Wait for the document to be published.
    publishButton.click()
    await expectPublishedStatus(paneFooter)

    // Open the Author reference input.
    await page.locator('#author-menuButton').click()
    await page.getByRole('menuitem').getByText('Replace').click()
    // instead of opening with the dropdown button, open with the space key
    await referenceInput.getByTestId('autocomplete').press('Space')
    await expect(popover).toBeVisible()
    await expect(authorListbox).toBeVisible()

    // Select the next document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(paneFooter).toContainText('Saved', {timeout: 30_000})

    // wait for the edit to finish
    await expectEditedStatus(paneFooter)

    // Wait for the document to be published.
    publishButton.click()
    await expectPublishedStatus(paneFooter)
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
    page.getByTestId('string-input').fill(originalTitle)

    await expect(
      page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton'),
    ).toBeVisible()
    /** create reference */
    await page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton').click()

    // Wait for the new document referenced to be created & loaded
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // switch to original doc
    page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    // open the context menu
    page.getByTestId('pane-context-menu-button').first().click()
    page.getByTestId('action-inspect').click()

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

    page.getByTestId('string-input').fill(originalTitle)

    await expect(
      page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton'),
    ).toBeVisible()
    /** create reference */
    await page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton').click()

    // Wait for the new document referenced to be created & loaded
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // switch to original doc
    page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    // open the context menu
    page.getByTestId('pane-context-menu-button').first().click()
    page.getByTestId('action-inspect').click()
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
    page.getByTestId('string-input').fill(originalTitle)

    /** create reference */
    await expect(
      page.getByTestId('create-new-document-select-referenceField-selectTypeMenuButton'),
    ).toBeVisible()
    page.getByTestId('create-new-document-select-referenceField-selectTypeMenuButton').click()

    // wait for the reference document to open
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // update and publish the reference
    page.getByTestId('string-input').nth(1).fill('Reference test')
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText(
      'Reference test',
    )
    page.getByTestId('action-publish').nth(1).click() // publish reference
    await expectPublishedStatus(documentStatus.nth(1))

    /** --- IN ORIGINAL DOC --- */
    page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    page.getByTestId('action-publish').first().click() // publish reference

    await expectPublishedStatus(documentStatus.first())

    // open the context menu
    page.getByTestId('pane-context-menu-button').first().click()
    page.getByTestId('action-inspect').click()

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
    page.getByTestId('create-new-document-select-referenceFieldWeak-selectTypeMenuButton').click()

    // wait for the reference document to open
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // update and publish the reference
    page.getByTestId('string-input').nth(1).fill('Reference test')
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText(
      'Reference test',
    )
    page.getByTestId('action-publish').nth(1).click() // publish reference
    await expectPublishedStatus(documentStatus.nth(1))

    /** --- IN ORIGINAL DOC --- */
    page.locator('[data-testid="document-pane"]', {hasText: originalTitle}).click()

    page.getByTestId('action-publish').first().click() // publish reference

    await expectPublishedStatus(documentStatus.first())

    // open the context menu
    page.getByTestId('pane-context-menu-button').first().click()
    page.getByTestId('action-inspect').click()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('referenceField._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).not.toBeVisible()
    await expect(page.getByText('referenceFieldWeak._weak_weak')).toBeVisible()
  })
})
