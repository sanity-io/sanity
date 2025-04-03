import {test as sanityTest} from '@sanity/test'

export const test = sanityTest.extend({
  // Extends the goto function to preserve the base pathname if it exists in the baseURL
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
})
