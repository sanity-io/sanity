import {test as base} from '@sanity/test'

// Define a test context extension with clipboard functionality
export const test = base.extend<{
  setClipboard: (content: string) => Promise<void>
  getClipboard: () => Promise<string>
  clipboardContent: {content: string}
}>({
  // Persistent clipboard state across navigations
  clipboardContent: [{content: ''}, {scope: 'test'}],

  // Extend page fixture to apply clipboard mock on new pages
  page: async ({page, clipboardContent}, use) => {
    // Function to set up clipboard mocks on the page
    const setupClipboardMocks = async () => {
      await page.addInitScript((content) => {
        ;(navigator.clipboard as any).writeText = (text: string) => {
          ;(window as any).__clipboardContent = text
          return Promise.resolve()
        }
        ;(navigator.clipboard as any).readText = () => {
          return Promise.resolve((window as any).__clipboardContent)
        }
        ;(window as any).__clipboardContent = content
      }, clipboardContent.content)
    }

    // Initial setup of clipboard mocks
    await setupClipboardMocks()

    // Reapply mocks after each navigation
    page.on('framenavigated', async () => {
      await setupClipboardMocks()
    })

    // Use the modified page in the test
    await use(page)
  },

  setClipboard: async ({page, clipboardContent}, use) => {
    await use(async (content: string) => {
      clipboardContent.content = content // Store the content in the test scope
      await page.evaluate((value) => navigator.clipboard.writeText(value), content)
    })
  },

  getClipboard: async ({page}, use) => {
    await use(async () => {
      return page.evaluate(() => navigator.clipboard.readText())
    })
  },
})

export const {expect} = test
