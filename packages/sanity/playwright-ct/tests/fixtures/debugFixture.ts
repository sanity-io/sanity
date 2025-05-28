import {test as base} from '@playwright/experimental-ct-react'

export const test = base.extend<{
  logActiveElement: () => Promise<{
    tagName: string
    id: string
    className: string
    name: string
    attributes: Record<string, string>
  }>
}>({
  logActiveElement: async ({page}, _use) => {
    await _use(async () => {
      const activeElementInfo = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement
        return {
          tagName: active.tagName,
          id: active.id,
          className: active.className,
          name: active.nodeName,
          attributes: Object.fromEntries(
            Array.from(active.attributes).map((attr) => [attr.name, attr.value]),
          ),
        }
      })
      return Promise.resolve(activeElementInfo)
    })
  },
})

export {expect} from '@playwright/test'
