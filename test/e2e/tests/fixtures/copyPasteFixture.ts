import {test as base} from '@sanity/test'

export const test = base.extend<{
  getClipboardItemByMimeTypeAsText: (mimeType: string) => Promise<string | null>
  setClipboardItems: (items: ClipboardItem[]) => Promise<void>
  getClipboardItems: () => Promise<ClipboardItem[]>
  getClipboardItemsAsText: () => Promise<string>
  clipboardItems: {items: ClipboardItem[]}
}>({
  clipboardItems: [{items: [] as ClipboardItem[]}, {scope: 'test'}],

  page: async ({page, clipboardItems}, use) => {
    const setupClipboardMocks = () => {
      page.addInitScript((items) => {
        const mockClipboard = {
          read: () => {
            return Promise.resolve((window as any).__clipboardItems)
          },
          write: (newItems: ClipboardItem[]) => {
            ;(window as any).__clipboardItems = newItems

            return Promise.resolve()
          },
          readText: () => {
            const textItem = items.find((item) => item.types.includes('text/plain'))
            return textItem
              ? textItem.getType('text/plain').then((blob: Blob) => blob.text())
              : Promise.resolve('')
          },
          writeText: (text: string) => {
            const textBlob = new Blob([text], {type: 'text/plain'})
            items.push(new ClipboardItem({'text/plain': textBlob}))
            return Promise.resolve()
          },
        }
        Object.defineProperty(navigator, 'clipboard', {
          value: mockClipboard,
          writable: false,
        })
        ;(window as any).__clipboardItems = items
      }, clipboardItems.items)
    }

    await setupClipboardMocks()

    page.on('framenavigated', async () => {
      await setupClipboardMocks()
    })

    await use(page)
  },

  setClipboardItems: async ({clipboardItems}, use) => {
    await use(async (items: ClipboardItem[]) => {
      clipboardItems.items = items
    })
  },

  getClipboardItems: async ({page}, use) => {
    await use(() => {
      return page.evaluate(() => navigator.clipboard.read())
    })
  },

  getClipboardItemsAsText: async ({page}, use) => {
    await use(async () => {
      return page.evaluate(async () => {
        const items = await navigator.clipboard.read()
        const textItem = items.find((item) => item.types.includes('text/plain'))

        return textItem
          ? textItem.getType('text/plain').then((blob: Blob) => blob.text())
          : Promise.resolve('')
      })
    })
  },

  getClipboardItemByMimeTypeAsText: async ({page}, use) => {
    await use(async (mimeType: string) => {
      return page.evaluate(async (mime) => {
        const items = await navigator.clipboard.read()
        const textItem = items.find((item) => item.types.includes(mime))
        const content = textItem ? textItem.getType(mime).then((blob: Blob) => blob.text()) : null

        return content
      }, mimeType)
    })
  },
})

export const {expect} = test
