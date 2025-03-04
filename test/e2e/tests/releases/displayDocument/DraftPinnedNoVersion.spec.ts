import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'
import {test} from '@sanity/test'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from './../utils/methods'

test.describe('draft pinned - draft or published, no version', () => {
  let draftDocument: SanityDocument
  let publishedDocument: SanityDocument

  test.beforeAll(async ({sanityClient, _testContext}) => {
    draftDocument = await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `drafts.${_testContext.getUniqueDocumentId()}`,
      _type: 'species',
      name: 'draft',
    })
    publishedDocument = await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).create({
      _id: `${_testContext.getUniqueDocumentId()}`,
      _type: 'species',
      name: 'published',
    })
  })

  test.afterAll(async ({sanityClient}) => {
    await sanityClient.delete(draftDocument._id)
    await sanityClient.delete(publishedDocument._id)
  })

  test('draft, no publish, no version - shows draft displayed', async ({page}) => {
    test.slow()
    await page.goto(`/test/content/species;${draftDocument._id}`)

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).toHaveAttribute('data-selected')
  })

  test('draft, publish, no version - shows draft from published displayed', async ({page}) => {
    test.slow()
    // specific document set up for this test in mind
    await page.goto(`/test/content/species;${publishedDocument._id}`)

    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      'published',
    )
  })
})
