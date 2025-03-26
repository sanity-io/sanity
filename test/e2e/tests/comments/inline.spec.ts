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
  await page.waitForSelector('div[role="textbox"][contenteditable=true]', WAIT_OPTIONS)
  await page
    .locator('[data-testid="pt-editor"]')
    .locator('div[role="textbox"][contenteditable=true]')
    .selectText()

  // 4. Click on the floating comment button to start authoring a comment.
  await page.waitForSelector('[data-testid="inline-comment-button"]', {
    ...WAIT_OPTIONS,
    state: 'visible',
  })

  const getCommentButton = () => page.locator('[data-testid="inline-comment-button"]')
  await expect(getCommentButton()).toBeVisible()
  getCommentButton().click({
    delay: 1000,
  })

  // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
  await page.waitForSelector('[data-testid="comment-input"]', {
    ...WAIT_OPTIONS,
    state: 'visible',
  })
  const getCommentInput = () => page.locator('[data-testid="comment-input"]')
  await expect(getCommentInput()).toBeVisible()

  const authoringDecorator = '[data-inline-comment-state="authoring"]'
  await page.waitForSelector(authoringDecorator, WAIT_OPTIONS)
  await expect(page.locator(authoringDecorator)).toHaveText(PTE_CONTENT_TEXT)

  // 6. Author the comment and submit it by clicking the send button.
  await getCommentInput().locator('div[role="textbox"]').fill('This is a comment')
  await getCommentInput().locator('[data-testid="comment-input-send-button"]').click({
    delay: 1000,
  })

  // 7. Verify the comment has been successfully added by checking for the presence of the
  //    comment decorator with the correct content.
  const addedDecorator = '[data-inline-comment-state="added"]'
  await page.waitForSelector(addedDecorator, WAIT_OPTIONS)
  await expect(page.locator(addedDecorator)).toHaveText(PTE_CONTENT_TEXT)

  // 8. Verify that the comments list is visible after the comment has been added.
  await page.waitForSelector('[data-testid="comments-list"]', WAIT_OPTIONS)
  await expect(page.locator('[data-testid="comments-list"]')).toBeVisible()

  // 9. Verify that the comment appears within the list and correctly references the intended content.
  const commentsListItem = '[data-testid="comments-list-item"]'
  await page.waitForSelector(commentsListItem, WAIT_OPTIONS)
  await expect(page.locator(commentsListItem)).toBeVisible()
  await expect(page.locator('[data-testid="comments-list-item-referenced-value"]')).toHaveText(
    PTE_CONTENT_TEXT,
  )
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
    await page.locator('[data-testid="comments-list-item-status-button"]').click()

    // 3. Verify that the text is no longer highlighted in the editor.
    await expect(page.locator('[data-inline-comment-state="added"]')).not.toBeVisible()
  })
})
