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
  // Fits every pane on the way to the document, so the document list is never collapsed
  test.use({viewport: {width: 2560, height: 1000}})

  test.fail(
    'saves text typed into a new block when navigating to another document right away',
    {annotation: {type: 'issue', description: 'https://github.com/sanity-io/sanity/issues/15261'}},
    async ({page, sanityClient, _testContext}) => {
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

      // Installed before the Studio loads, so its timers can be paused while editing, see below
      await page.clock.install()
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

      // The edits are only lost when the document is left before the editor flushes them on its
      // own timers and before the autocommit after the first edit runs. Pausing the page's timers
      // from the first edit until this editor is gone makes that the case however long the click
      // takes. The document pane is keyed by document id, so leaving the document removes it.
      const editor = await body.getByRole('textbox').elementHandle()
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1_000)

      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Typed into the new block')

      await otherDocumentLink.click()
      await expect.poll(() => editor.evaluate((node) => node.isConnected)).toBe(false)
      await page.clock.resume()

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
    },
  )
})
