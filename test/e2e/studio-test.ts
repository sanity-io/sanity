// eslint-disable-next-line no-restricted-imports
import {test as sanityTest} from '@sanity/test'

export const test = sanityTest.extend({
  // Extends the goto function to preserve the base pathname if it exists in the baseURL
  // This is used to ensure the navigation goes to the correct workspace.
  page: async ({page, baseURL}, use) => {
    const originalGoto = page.goto.bind(page)
    const baseUrl = new URL(baseURL || '')
    const basePath = baseUrl.pathname

    page.goto = async (url, options) => {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = `${baseUrl.origin}${basePath}${url}`
      }
      return await originalGoto(url, options)
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page)
  },
  createDraftDocument: async ({page, _testContext}, use) => {
    async function createDraftDocument(navigationPath: string) {
      const id = _testContext.getUniqueDocumentId()

      await page.goto(`${navigationPath};${id}`)
      await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 30_000})

      await page
        .locator('[data-testid="form-view"]:not([data-read-only="true"])')
        .waitFor({state: 'visible', timeout: 30_000})

      return id
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createDraftDocument)
  },
})
