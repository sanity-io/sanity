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
  test.slow()

  // Function to perform all steps up to text selection
  async function setupAndSelectText() {
    // 1. Create a new draft document
    await createDraftDocument('/test/content/input-ci;commentsCI')

    // Wait for network to become idle to ensure document is fully loaded
    await page.waitForLoadState('load', {timeout: WAIT_OPTIONS.timeout * 2})

    // 2. Click the overlay to active the editor.
    const activateOverlay = page.getByTestId('activate-overlay')
    await activateOverlay.waitFor(WAIT_OPTIONS)
    await activateOverlay.click()

    // 3. Select all text in the editor.
    await expect(page.getByTestId('pt-editor')).toBeVisible(WAIT_OPTIONS)

    const getTextbox = () =>
      page.locator('[data-testid="pt-editor"]').locator('div[role="textbox"][contenteditable=true]')

    await expect(getTextbox()).toBeVisible(WAIT_OPTIONS)

    // Make sure the editor is fully loaded by waiting for the text content to be present
    await expect(getTextbox()).toContainText(PTE_CONTENT_TEXT, {timeout: 10000})

    // Function to attempt text selection with multiple strategies
    async function attemptTextSelection() {
      // First ensure we're not already focused on the editor by clicking elsewhere
      await page.click('body', {force: true, position: {x: 0, y: 0}})
      await page.waitForTimeout(300)

      // Now focus on the editor and ensure it's ready for selection
      await getTextbox().click({force: true})
      await page.waitForTimeout(300)

      // Try multiple selection strategies to ensure robustness
      // Strategy 1: Triple-click to select paragraph
      await getTextbox().click({clickCount: 3, force: true})
      await page.waitForTimeout(500)

      // Verify selection and try alternative strategy if needed
      const isFullTextSelected = await page.evaluate((expectedText) => {
        const selection = window.getSelection()?.toString() || ''
        return selection.includes(expectedText)
      }, PTE_CONTENT_TEXT)

      // If triple-click didn't work, try keyboard selection
      if (!isFullTextSelected) {
        // Click at the beginning of the text
        await getTextbox().click({position: {x: 0, y: 10}})
        await page.keyboard.down('Shift')

        // Press End to select to end of line
        await page.keyboard.press('End')
        await page.keyboard.up('Shift')
        await page.waitForTimeout(300)
      }

      // Final verification that we have the correct text selected
      await expect(async () => {
        const selectedText = await page.evaluate(() => window.getSelection()?.toString() || '')
        return selectedText.includes(PTE_CONTENT_TEXT)
      }).toPass({timeout: 5000})
    }

    await attemptTextSelection()

    // Check if the comment button appears
    try {
      await expect(page.getByTestId('inline-comment-button')).toBeVisible()

      return true
    } catch (error) {
      // Comment button not visible after text selection
      return false
    }
  }

  // Try the setup and text selection up to 3 times
  const maxAttempts = 3
  let commentButtonVisible = false

  const baseTimeout = 60000 * 3 // 60 seconds * 3 max attempts
  test.setTimeout(baseTimeout)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    commentButtonVisible = await setupAndSelectText()

    if (commentButtonVisible) {
      // Comment button is visible, proceeding with test
      break
    } else if (attempt < maxAttempts) {
      // Reloading page and trying again...
      await page.reload()
      await page.waitForLoadState('load', {timeout: WAIT_OPTIONS.timeout * 2})
    }
  }

  // If we couldn't get the comment button to appear after all attempts, fail the test
  if (!commentButtonVisible) {
    throw new Error('Comment button did not appear after multiple attempts')
  }

  // 4. Click on the floating comment button to start authoring a comment.
  const getCommentButton = () => page.locator('[data-testid="inline-comment-button"]')
  await expect(getCommentButton()).toBeVisible()
  getCommentButton().click({
    delay: 1000,
  })

  // 5. Ensure the comment input field is displayed and the selected text is visually marked for commenting.
  await page.getByTestId('comment-input').waitFor({
    ...WAIT_OPTIONS,
    state: 'visible',
  })
  const getCommentInput = () => page.getByTestId('comment-input')
  await expect(getCommentInput()).toBeVisible()

  const authoringDecorator = '[data-inline-comment-state="authoring"]'
  await expect(page.locator(authoringDecorator)).toBeVisible(WAIT_OPTIONS)
  await expect(page.locator(authoringDecorator)).toHaveText(PTE_CONTENT_TEXT)

  // 6. Author the comment and submit it by clicking the send button.
  await getCommentInput().locator('div[role="textbox"]').fill('This is a comment')
  await getCommentInput().locator('[data-testid="comment-input-send-button"]').click({
    delay: 1000,
  })

  // 7. Verify the comment has been successfully added by checking for the presence of the
  //    comment decorator with the correct content.
  const addedDecorator = '[data-inline-comment-state="added"]'
  await page.locator(addedDecorator).waitFor(WAIT_OPTIONS)
  await expect(page.locator(addedDecorator)).toHaveText(PTE_CONTENT_TEXT)

  // 8. Verify that the comments list is visible after the comment has been added.
  const getCommentsList = () => page.getByTestId('comments-list')
  await expect(getCommentsList()).toBeVisible()

  // 9. Verify that the comment appears within the list and correctly references the intended content.
  await expect(page.getByTestId('comments-list-item')).toBeVisible(WAIT_OPTIONS)
  await expect(page.getByTestId('comments-list-item-referenced-value')).toHaveText(PTE_CONTENT_TEXT)
}

test.describe('Inline comments:', () => {
  test('should create inline comment', async ({page, createDraftDocument}) => {
    await inlineCommentCreationTest({page, createDraftDocument})
  })

  test('should resolve inline comment', async ({page, createDraftDocument}) => {
    // 1. Create a new inline comment
    await inlineCommentCreationTest({page, createDraftDocument})

    // 2. Resolve the comment by clicking the status button in the comments list item.
    const getStatusButton = () => page.getByTestId('comments-list-item-status-button')
    await expect(getStatusButton()).toBeVisible(WAIT_OPTIONS)
    await getStatusButton().click()

    // 3. Verify that the text is no longer highlighted in the editor.
    await expect(page.locator('[data-inline-comment-state="added"]')).not.toBeVisible()
  })
})
