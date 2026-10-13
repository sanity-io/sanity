import {expect} from '@playwright/test'

import {test} from '../../studio-test'

const SIMPLE_BLOCK_LIST = '/content/input-standard;portable-text;simpleBlock'

function paragraph(key: string, text: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-span`, text, marks: []}],
  }
}

interface SimpleBlockDraft {
  body?: {children?: {text?: string}[]}[]
}

test.describe('Portable Text Input - navigating away after typing', () => {
  // https://github.com/sanity-io/sanity/issues/15261
  test('saves text typed into a new block when navigating to another document right away', async ({
    page,
    sanityClient,
    _testContext,
  }) => {
    const documentId = _testContext.getUniqueDocumentId()
    const otherDocumentId = _testContext.getUniqueDocumentId()

    await sanityClient.createOrReplace({
      _id: `drafts.${otherDocumentId}`,
      _type: 'simpleBlock',
      title: 'Other document',
      body: [paragraph('other', 'Paragraph in the other document')],
    })
    await sanityClient.createOrReplace({
      _id: `drafts.${documentId}`,
      _type: 'simpleBlock',
      title: 'Edited document',
      body: [paragraph('existing', 'Existing paragraph')],
    })

    await page.goto(`${SIMPLE_BLOCK_LIST};${documentId}`)

    const body = page.getByTestId('field-body')
    const existingBlock = body.locator(
      '[data-testid="text-block__text"]:not([data-read-only="true"])',
    )
    await expect(existingBlock).toHaveText('Existing paragraph')

    const otherDocumentLink = page
      .getByTestId('document-list-pane')
      .locator(`a[href*="${otherDocumentId}"]`)
    await expect(otherDocumentLink).toBeVisible()

    // The style menu shows the block style once the editor has a selection
    await existingBlock.click()
    await expect(body.getByTestId('block-style-select')).toContainText('Normal')

    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Typed into the new block')

    // Leave right away, before the editor's batched edits have been committed
    await otherDocumentLink.click()
    await expect(page.getByTestId('field-body')).toContainText('Paragraph in the other document')

    await expect
      .poll(
        async () => {
          const draft = await sanityClient.getDocument<SimpleBlockDraft>(`drafts.${documentId}`)
          return draft?.body?.map((block) => block.children?.map((span) => span.text).join(''))
        },
        {timeout: 15_000},
      )
      .toEqual(['Existing paragraph', 'Typed into the new block'])
  })
})
