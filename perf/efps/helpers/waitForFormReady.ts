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
}
