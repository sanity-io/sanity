import {expect, type Page} from '@playwright/test'
import {test} from '@sanity/test'

const WAIT_OPTIONS = {
  timeout: 20 * 1000, // 20 seconds
}

// This text is in the initial value of the body field of the document (i.e the "commentsCI" document type)
const PTE_CONTENT_TEXT = 'This is some text in the body field'

interface InlineCommentCreationTestProps {
  page: Page
  createDraftDocument: (path: string) => Promise<string>
}

// The base test for creating an inline comment.
async function inlineCommentCreationTest(props: InlineCommentCreationTestProps) {
  const {page, createDraftDocument} = props

  // 1. Create a new draft document
  await createDraftDocument('/test/content/input-ci;commentsCI')

  // 2. Click the overlay to active the editor.
  await page.waitForSelector('[data-testid="activate-overlay"]', WAIT_OPTIONS)
  await page.click('[data-testid="activate-overlay"]')

  // 3. Select all text in the editor.
  await page.waitForSelector('[data-testid="pt-editor"]', WAIT_OPTIONS)
  const editor = page.locator('[data-testid="pt-editor"]')
  await page.waitForSelector('div[role="textbox"][contenteditable=true]', WAIT_OPTIONS)
  const textBox = editor.locator('div[role="textbox"][contenteditable=true]')
  await textBox.selectText()

  // 4. Click on the floating comment button to start authoring a comment.
  await page.waitForSelector('[data-testid="inline-comment-button"]', {
    ...WAIT_OPTIONS,
    state: 'visible',
  })

  const button = page.locator('[data-testid="inline-comment-button"]')
  await expect(button).toBeVisible()
  button.click({
    delay: 1000,
  })

  // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
  await page.waitForSelector('[data-testid="comment-input"]', {
    ...WAIT_OPTIONS,
    state: 'visible',
  })
  const commentInput = page.locator('[data-testid="comment-input"]')
  await expect(commentInput).toBeVisible()

  await page.waitForSelector('[data-inline-comment-state="authoring"]', WAIT_OPTIONS)
  const authoringDecorator = page.locator('[data-inline-comment-state="authoring"]')
  await expect(authoringDecorator).toHaveText(PTE_CONTENT_TEXT)

  // 6. Author the comment and submit it by clicking the send button.
  const commentInputTextBox = commentInput.locator('div[role="textbox"]')
  await commentInputTextBox.fill('This is a comment')
  const sendButton = commentInput.locator('[data-testid="comment-input-send-button"]')
  await sendButton.click({
    delay: 1000,
  })

  // 7. Verify the comment has been successfully added by checking for the presence of the
  //    comment decorator with the correct content.
  await page.waitForSelector('[data-inline-comment-state="added"]', WAIT_OPTIONS)
  const addedDecorator = page.locator('[data-inline-comment-state="added"]')
  await expect(addedDecorator).toHaveText(PTE_CONTENT_TEXT)

  // 8. Verify that the comments list is visible after the comment has been added.
  await page.waitForSelector('[data-testid="comments-list"]', WAIT_OPTIONS)
  const commentsList = page.locator('[data-testid="comments-list"]')
  await expect(commentsList).toBeVisible()

  // 9. Verify that the comment appears within the list and correctly references the intended content.
  await page.waitForSelector('[data-testid="comments-list-item"]', WAIT_OPTIONS)
  const commentsListItem = page.locator('[data-testid="comments-list-item"]')
  await expect(commentsListItem).toBeVisible()
  const commentsListItemReferencedValue = page.locator(
    '[data-testid="comments-list-item-referenced-value"]',
  )
  await expect(commentsListItemReferencedValue).toHaveText(PTE_CONTENT_TEXT)
}

test.describe('Inline comments:', () => {
  test('should create inline comment', async ({page, createDraftDocument, browserName}) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    await inlineCommentCreationTest({page, createDraftDocument})
  })

  test('should resolve inline comment', async ({page, createDraftDocument, browserName}) => {
    // For now, only test in Chromium due to flakiness in Firefox and WebKit
    test.skip(browserName !== 'chromium')

    // 1. Create a new inline comment
    await inlineCommentCreationTest({page, createDraftDocument})

    // 2. Resolve the comment by clicking the status button in the comments list item.
    await page.waitForSelector('[data-testid="comments-list-item-status-button"]', WAIT_OPTIONS)
    const statusButton = page.locator('[data-testid="comments-list-item-status-button"]')
    await statusButton.click()

    // 3. Verify that the text is no longer highlighted in the editor.
    const addedDecorator = page.locator('[data-inline-comment-state="added"]')
    await expect(addedDecorator).not.toBeVisible()
  })
})
