import {type Page} from '@playwright/test'

/** used for detecting changes of opacity, especially useful when testing with motion */
export async function waitForOpacityChange(page: Page, selector: string, timeout = 10000) {
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel)
      if (element) {
        return getComputedStyle(element).opacity === '1'
      }
      return false
    },
    selector,
    {timeout},
  )
}
