import {expect} from '@playwright/test'
import {test} from '@sanity/test'

// This text is in the initial value of the body field of the document (i.e the "commentsCI" document type)
const PTE_CONTENT_TEXT = 'This is some text in the body field'

test.describe('Inline comments:', () => {
  test('should create inline comment', async ({page, createDraftDocument}) => {
    // 1. Create a new draft document
    await createDraftDocument('/test/content/input-ci;commentsCI')

    // 2. Activate the editor interface to ensure it's ready for user interaction.
    await page.click('[data-testid="activate-overlay"]')

    // 3. Locate and select the text within the editor that the comment will be attached to.
    const editor = page.locator('[data-testid="pt-editor"]')
    const textBox = editor.locator('div[role="textbox"]')
    textBox.selectText()

    // 4. Click the button to initiate the comment process, opening the input area for the comment.
    await page.waitForSelector('[data-testid="inline-comment-button"]')
    const button = page.locator('[data-testid="inline-comment-button"]')
    button.click()

    // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
    await page.waitForSelector('[data-inline-comment-state="authoring"]')
    const commentInput = page.locator('[data-testid="comment-input"]')
    const authoringDecorator = page.locator('[data-inline-comment-state="authoring"]')
    await expect(authoringDecorator).toHaveText(PTE_CONTENT_TEXT)
    await expect(commentInput).toBeVisible()

    // 6. Author the comment and submit it using the send button.
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
