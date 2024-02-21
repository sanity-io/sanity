import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const WAIT_OPTIONS = {
  timeout: 20 * 1000, // 20 seconds
}

// This text is in the initial value of the body field of the document (i.e the "commentsCI" document type)
const PTE_CONTENT_TEXT = 'This is some text in the body field'

test.describe('Inline comments:', () => {
  test('should create inline comment', async ({page, createDraftDocument}) => {
    // 1. Create a new draft document
    await createDraftDocument('/test/content/input-ci;commentsCI')

    // 2. Click the overlay to active the editor.
    await page.waitForSelector('[data-testid="activate-overlay"]', WAIT_OPTIONS)
    await page.click('[data-testid="activate-overlay"]')

    // 3. Select all text in the editor.
    const editor = page.locator('[data-testid="pt-editor"]')
    const textBox = editor.locator('div[role="textbox"]')
    textBox.selectText()

    // 4. Click on the floating comment button to start authoring a comment.
    await page.waitForSelector('[data-testid="inline-comment-button"]', WAIT_OPTIONS)
    const button = page.locator('[data-testid="inline-comment-button"]')
    button.click()

    // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
    await page.waitForSelector('[data-testid="comment-input"]', WAIT_OPTIONS)
    const commentInput = page.locator('[data-testid="comment-input"]')
    await expect(commentInput).toBeVisible()

    await page.waitForSelector('[data-inline-comment-state="authoring"]', WAIT_OPTIONS)
    const authoringDecorator = page.locator('[data-inline-comment-state="authoring"]')
    await expect(authoringDecorator).toHaveText(PTE_CONTENT_TEXT)

    // 6. Author the comment and submit it by clicking the send button.
    const commentInputTextBox = commentInput.locator('div[role="textbox"]')
    await commentInputTextBox.fill('This is a comment')
    const sendButton = commentInput.locator('[data-testid="comment-input-send-button"]')
    await sendButton.click()

    // 7. Verify the comment has been successfully added by checking for the presence of the
    //    comment decorator with the correct content.
    const addedDecorator = page.locator('[data-inline-comment-state="added"]')
    await expect(addedDecorator).toHaveText(PTE_CONTENT_TEXT)

    // 8. Verify that the comments list is visible after the comment has been added.
    const commentsList = page.locator('[data-testid="comments-list"]')
    await expect(commentsList).toBeVisible()

    // 9. Verify that the comment appears within the list and correctly references the intended content.
    const commentsListItem = page.locator('[data-testid="comments-list-item"]')
    await expect(commentsListItem).toBeVisible()
    const commentsListItemReferencedValue = page.locator(
      '[data-testid="comments-list-item-referenced-value"]',
    )
    await expect(commentsListItemReferencedValue).toHaveText(PTE_CONTENT_TEXT)
  })
})
