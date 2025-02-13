import {expect, type Locator, test as baseTest} from '@playwright/test'

type ScrollToTop = (locator: Locator) => Promise<void>

export const test = baseTest.extend<{
  scrollToTop: ScrollToTop
}>({
  scrollToTop: async ({page}, _use) => {
    const scrollToTop: ScrollToTop = async (locator: Locator) => {
      await locator.evaluate((element) => {
        element.scrollIntoView({block: 'start', inline: 'nearest'})
      })

      const boundingBox = await locator.boundingBox()
      await expect(boundingBox?.y).toBeLessThanOrEqual(1)
    }

    await _use(scrollToTop)
  },
})
