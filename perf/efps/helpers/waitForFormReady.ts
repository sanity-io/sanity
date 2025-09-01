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

  // Additional wait to ensure async draft creation operations complete
  // This addresses race conditions where the form appears ready but
  // backend operations (version.create) are still pending
  await page.waitForFunction(
    () => {
      // Check that the form is stable and inputs are responsive
      const form = document.querySelector('[data-testid="form-view"]')
      if (!form || form.getAttribute('data-read-only') === 'true') {
        return false
      }

      // Look for any inputs in the form to ensure they're ready
      const inputs = form.querySelectorAll('input, textarea, [contenteditable="true"]')
      if (inputs.length === 0) {
        return false
      }

      // Ensure no loading states are active
      const loadingElements = document.querySelectorAll(
        '[data-testid*="loading"], [data-testid*="spinner"]',
      )
      const hasActiveLoading = Array.from(loadingElements).some(
        (el) =>
          el.getAttribute('data-testid')?.includes('loading') ||
          el.getAttribute('data-testid')?.includes('spinner'),
      )

      return !hasActiveLoading
    },
    {timeout: 15000},
  )
}
