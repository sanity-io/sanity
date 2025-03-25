/* eslint-disable react-hooks/rules-of-hooks */
import fs from 'node:fs'
import path from 'node:path'

import {test as sanityFixtures} from '@sanity/test'

export const test = sanityFixtures.extend({
  context: async ({browser}, use, testInfo) => {
    const harPath = path.join(testInfo.outputDir, 'network.har')

    const context = await browser.newContext({
      recordHar: {path: harPath},
    })

    await use(context)

    await context.close()

    // Clean up or keep HAR file depending on result
    if (testInfo.status === testInfo.expectedStatus) {
      try {
        fs.unlinkSync(harPath)
      } catch {
        console.error(`Failed to delete HAR file: ${harPath}`)
      }
    } else {
      // eslint-disable-next-line no-console
      console.info(`HAR recorded for failed test: ${harPath}`)
    }
  },
})
