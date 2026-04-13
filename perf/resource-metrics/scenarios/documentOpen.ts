import {type Scenario} from '../types'

export const documentOpen: Scenario = {
  name: 'document-open',
  description: 'Navigate to a document and wait for the form to be visible and editable',
  getUrl(baseUrl: string, documentId: string, documentType: string) {
    return `${baseUrl}/desk/intent/edit/id=${encodeURIComponent(documentId)};type=${encodeURIComponent(documentType)}`
  },
  async waitForReady(page) {
    await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 60_000})
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: 60_000})
  },
}
