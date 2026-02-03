import {expect, type Page} from '@playwright/test'

import {test} from '../../studio-test'

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
  await createDraftDocument('/content/input-ci;commentsCI')

  // 2. Click the editor
  const editor = page.getByTestId('pt-editor')
  await editor.click()

  // 3. Select all text in the editor.
  await page.getByTestId('pt-editor').waitFor(WAIT_OPTIONS)
  await expect(editor).toBeVisible()
  const textbox = page.getByTestId('pt-editor').locator('div[role="textbox"][contenteditable=true]')
  await textbox.selectText()

  // 4. Click on the floating comment button to start authoring a comment.
  const inlineCommentButton = page.getByTestId('inline-comment-button')
  await expect(inlineCommentButton).toBeVisible()
  await expect(inlineCommentButton).toBeEnabled()
  await inlineCommentButton.click({
    delay: 1000,
  })

  // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
  const commentInput = page.getByTestId('comment-input')
  await expect(commentInput).toBeVisible()
  await expect(commentInput).toBeEnabled()

  const authoringDecorator = page.locator('[data-inline-comment-state="authoring"]')
  await expect(authoringDecorator).toBeVisible()
  await expect(authoringDecorator).toHaveText(PTE_CONTENT_TEXT)

  // 6. Author the comment and submit it by clicking the send button.
  const commentInputTextBox = commentInput.locator('div[role="textbox"]')
  await commentInputTextBox.fill('This is a comment')
  const sendButton = commentInput.getByTestId('comment-input-send-button')
  await expect(sendButton).toBeEnabled(WAIT_OPTIONS)
  await sendButton.click()

  // 7. Verify the comment has been successfully added by checking for the presence of the
  //    comment decorator with the correct content.
  const addedDecorator = page.locator('[data-inline-comment-state="added"]')
  await expect(addedDecorator).toBeVisible()
  await expect(addedDecorator).toHaveText(PTE_CONTENT_TEXT)

  // 8. Verify that the comments list is visible after the comment has been added.
  const commentsList = page.getByTestId('comments-list')
  await expect(commentsList).toBeVisible()

  // 9. Verify that the comment appears within the list and correctly references the intended content.
  const commentsListItem = page.getByTestId('comments-list-item')
  await expect(commentsListItem).toBeVisible()
  const commentsListItemReferencedValue = page.getByTestId('comments-list-item-referenced-value')
  await expect(commentsListItemReferencedValue).toBeVisible()
  await expect(commentsListItemReferencedValue).toHaveText(PTE_CONTENT_TEXT)
}

test.describe('Inline comments:', () => {
  test('should create and resolve inline comment', async ({
    page,
    createDraftDocument,
    browserName,
  }) => {
    // For now, only test in other browsers except firefox due to flakiness in Firefox with the requests
    test.skip(browserName === 'firefox')
    // 1. Create a new inline comment
    await inlineCommentCreationTest({page, createDraftDocument})

    // 2. Resolve the comment by clicking the status button in the comments list item.
    const statusButton = page.getByTestId('comments-list-item-status-button')
    await expect(statusButton).toBeVisible()
    await expect(statusButton).toBeEnabled()
    await statusButton.click()

    // 3. Verify that the text is no longer highlighted in the editor.
    const addedDecorator = page.locator('[data-inline-comment-state="added"]')
    await expect(addedDecorator).not.toBeVisible()
  })
})
