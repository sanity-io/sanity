import {type Page} from 'playwright'

/**
 * Wait for the document form to be ready for editing.
 *
 * This accounts for the asynchronous nature of draft creation via version.create.
 * The form sets data-read-only="true" when editState?.ready is false, so we wait
 * for this attribute to be removed, indicating the document is ready for editing.
 */
export async function waitForFormReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const form = document.querySelector('[data-testid="form-view"]')
      return form && form.getAttribute('data-read-only') !== 'true'
    },
    {timeout: 10000},
  )

  // Additional check: wait for document status to show draft creation completion
  // This addresses race conditions with asynchronous version.create operations
  // Uses the same locator pattern as e2e tests for consistency
  const documentStatus = page.getByTestId('pane-footer-document-status')
  await documentStatus.waitFor({state: 'visible', timeout: 15000})

  // Wait for "Draft created" status text to confirm the draft creation is complete
  await page.waitForFunction(
    () => {
      const statusElement = document.querySelector('[data-testid="pane-footer-document-status"]')
      if (!statusElement) return false

      const statusText = statusElement.textContent || ''
      // Wait for the exact "Draft created" text that appears after version.create completes
      return statusText.includes('Draft created')
    },
    {timeout: 15000},
  )
}
