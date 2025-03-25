/* eslint-disable react-hooks/rules-of-hooks */
import fs from 'node:fs'
import path from 'node:path'

import {test as sanityFixtures} from '@sanity/test'

export const test = sanityFixtures.extend({
  context: async ({browser}, use, testInfo) => {
    const harPath = path.join(testInfo.outputDir, 'network.har')
    const videoPath = path.join(testInfo.outputDir, 'video.webm')

    const context = await browser.newContext({
      recordHar: {path: harPath},
      recordVideo: {dir: testInfo.outputDir},
    })

    await use(context) // give the context to the test

    await context.close()

    if (testInfo.status === testInfo.expectedStatus) {
      try {
        fs.unlinkSync(harPath)
        fs.unlinkSync(videoPath)
      } catch {
        // ignore
      }
    } else {
      await testInfo.attach('Network traffic', {
        path: harPath,
        contentType: 'application/json',
      })

      // ✅ Manually attach the video
      if (fs.existsSync(videoPath)) {
        await testInfo.attach('Video recording', {
          path: videoPath,
          contentType: 'video/webm',
        })
      }
    }
  },
})
