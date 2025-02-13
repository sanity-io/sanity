import {test as base} from '@playwright/experimental-ct-react'

export const test = base.extend<{
  getClipboardItemByMimeTypeAsText: (mimeType: string) => Promise<string | null>
  setClipboardItems: (items: ClipboardItem[]) => Promise<void>
  getClipboardItems: () => Promise<ClipboardItem[]>
  getClipboardItemsAsText: () => Promise<string>
}>({
  page: async ({page}, _use) => {
    const setupClipboardMocks = async () => {
      await page.addInitScript(() => {
        const mockClipboard = {
          read: () => {
            return Promise.resolve((window as any).__clipboardItems)
          },
          write: (newItems: ClipboardItem[]) => {
            ;(window as any).__clipboardItems = newItems

            return Promise.resolve()
          },
          readText: () => {
            const items = (window as any).__clipboardItems as ClipboardItem[]
            const textItem = items.find((item) => item.types.includes('text/plain'))
            return textItem
              ? textItem.getType('text/plain').then((blob: Blob) => blob.text())
              : Promise.resolve('')
          },
          writeText: (text: string) => {
            const textBlob = new Blob([text], {type: 'text/plain'})
            ;(window as any).__clipboardItems = [new ClipboardItem({'text/plain': textBlob})]
            return Promise.resolve()
          },
        }
        Object.defineProperty(Object.getPrototypeOf(navigator), 'clipboard', {
          value: mockClipboard,
          writable: false,
        })
        ;(window as any).__clipboardItems = []
      })
    }

    await setupClipboardMocks()

    page.on('framenavigated', async () => {
      await setupClipboardMocks()
    })

    await _use(page)
  },

  setClipboardItems: async ({page}, _use) => {
    await _use(async (items: ClipboardItem[]) => {
      ;(window as any).__clipboardItems = items
    })
  },

  getClipboardItems: async ({page}, _use) => {
    await _use(() => {
      return page.evaluate(() => navigator.clipboard.read())
    })
  },

  getClipboardItemsAsText: async ({page}, _use) => {
    await _use(async () => {
      return page.evaluate(async () => {
        const items = await navigator.clipboard.read()
        const textItem = items.find((item) => item.types.includes('text/plain'))

        return textItem
          ? textItem.getType('text/plain').then((blob: Blob) => blob.text())
          : Promise.resolve('')
      })
    })
  },

  getClipboardItemByMimeTypeAsText: async ({page}, _use) => {
    await _use(async (mimeType: string) => {
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
