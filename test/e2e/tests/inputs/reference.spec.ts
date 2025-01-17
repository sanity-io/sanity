import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {withDefaultClient} from '../../helpers'

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

    await createDraftDocument('/test/content/book')

    // Reference fields don't seem to be given a test id, so this selection can't be more specific
    // at the moment e.g. `page.getByTestId('field-author')`.
    const referenceInput = page.getByTestId('reference-input')
    const paneFooter = page.getByTestId('pane-footer')
    const publishButton = page.getByTestId('action-publish')
    const authorListbox = page.locator('#author-listbox')

    // Open the Author reference input.
    await referenceInput.getByLabel('Open').click()
    await expect(authorListbox).toBeVisible()

    // Select the first document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Wait for the document to be published.
    publishButton.click()
    await expect(paneFooter).toContainText('Published just now')

    // Open the Author reference input.
    await page.locator('#author-menuButton').click()
    await page.getByRole('menuitem').getByText('Replace').click()
    await referenceInput.getByLabel('Open').click()
    await expect(authorListbox).toBeVisible()

    // Select the next document in the list.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(paneFooter).toContainText('Saved')

    // Wait for the document to be published.
    publishButton.click()
    await expect(paneFooter).toContainText('Published just now')
  })

  test(`_strengthenOnPublish and _weak properties exist when adding reference`, async ({
    page,
    createDraftDocument,
  }) => {
    test.slow()
    const originalTitle = 'Initial Doc'

    await createDraftDocument('/test/content/input-standard;referenceTest')
    page.getByTestId('string-input').fill(originalTitle)

    await expect(
      page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton'),
    ).toBeVisible()
    /** create reference */
    await page.getByTestId('create-new-document-select-aliasRef-selectTypeMenuButton').click()

    // Wait for the new document referenced to be created & loaded
    await expect(page.getByTestId('document-panel-document-title').nth(1)).toContainText('Untitled')

    // switch to original doc
    page.getByText('PublishedDraft').first().click()

    // open the context menu
    page.getByTestId('pane-context-menu-button').first().click()
    page.getByTestId('action-inspect').click()

    /** Checks that the properties were added when a weak reference is added */
    await expect(
      page.getByText('aliasRef._strengthenOnPublish_strengthenOnPublish:{…} 3 properties'),
    ).toBeVisible()
    await expect(page.getByText('aliasRef._weak_weak:true')).toBeVisible()
  })

  test(`_strengthenOnPublish and _weak properties are removed when the reference and document are published`, async ({
    page,
    createDraftDocument,
  }) => {
    // this is in a situation where the _strengthenOnPublish.weak is not set

    test.slow()
    const originalTitle = 'Initial Doc'
    const documentStatus = page.getByTestId('pane-footer-document-status')

    await createDraftDocument('/test/content/input-debug;simpleReferences')
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
    await expect(documentStatus.nth(1)).toContainText('Published just now')

    /** --- IN ORIGINAL DOC --- */
    page.getByText('PublishedDraft').first().click()

    page.getByTestId('action-publish').first().click() // publish reference

    await expect(documentStatus.first()).toContainText('Published just now')

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

    await createDraftDocument('/test/content/input-debug;simpleReferences')
    page.getByTestId('string-input').fill(originalTitle)

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
    await expect(documentStatus.nth(1)).toContainText('Published just now')

    /** --- IN ORIGINAL DOC --- */
    page.getByText('PublishedDraft').first().click()

    page.getByTestId('action-publish').first().click() // publish reference

    await expect(documentStatus.first()).toContainText('Published just now')

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
