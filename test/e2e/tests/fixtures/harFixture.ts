/* eslint-disable react-hooks/rules-of-hooks */
import path from 'node:path'

import {test as base} from '@sanity/test'

export const test = base.extend<{
  harRecorder: void
}>({
  harRecorder: async ({browser}, use, testInfo) => {
    const harPath = path.join(testInfo.outputDir, 'network.har')

    const context = await browser.newContext({
      recordHar: {path: harPath},
    })

    const page = await context.newPage()
    await page.goto('about:blank')
    await context.close()

    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('Network traffic', {
        path: harPath,
        contentType: 'application/json',
      })
    }

    await use(undefined)
  },
})
