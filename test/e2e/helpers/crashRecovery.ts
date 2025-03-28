/* eslint-disable no-console */
import {type Page, type TestInfo} from '@playwright/test'

export async function withCrashRecovery<T>(
  page: Page,
  testInfo: TestInfo,
  testFn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
  } = {},
): Promise<T> {
  const {maxRetries = 2, retryDelay = 1000} = options
  let retries = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Create a promise that will reject if crash is detected
      const crashDetector = detectCrash(page)

      // Race the test function against crash detection
      const result = await Promise.race([
        testFn(),
        crashDetector.then(() => {
          throw new Error('Content tool crashed')
        }),
      ])

      return result
    } catch (error) {
      if (retries >= maxRetries || !error.message?.includes('Content tool crashed')) {
        throw error
      }

      console.log(`Content tool crashed. Retrying... (${retries + 1}/${maxRetries})`)
      testInfo.attachments.push({
        name: `crash-screenshot-retry-${retries}.png`,
        contentType: 'image/png',
        body: await page.screenshot(),
      })

      await page.reload()
      await page.waitForLoadState('networkidle')
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retries++
    }
  }
}

function detectCrash(page: Page): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const crashed = await page
        .evaluate(() => {
          return (
            document.body.innerText.includes('The content tool crashed') ||
            document.body.innerText.includes('Something went wrong')
          )
        })
        .catch(() => false)

      if (crashed) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 500)

    page.once('load', () => clearInterval(checkInterval))
  })
}
