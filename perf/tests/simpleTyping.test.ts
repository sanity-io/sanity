import {uuid} from '@sanity/uuid'
import {PerformanceTestContext, PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['simple-typing-speed-test'],
  name: 'Simple typing speed test',
  description: `
  This test measures the typing speed of a simple text field. It's collecting results as a regression in percentage between the base branch and the current branch. A negative value means that the current branch is faster than the base branch.
  `,
  metrics: {
    lagPerKeystroke: {
      title: 'Lag',
      description: 'The lag measured while running the tests',
      unit: 'ms',
    },
    timePerKeyStroke: {
      title: 'Time per keystroke',
      unit: 'ms',
      description: 'The measured time per keystroke',
    },
  },
  version: 1,
  async run({page, client, url}: PerformanceTestContext) {
    const documentId = uuid()

    await page.goto(`${url}/desk/simple;${documentId}`)

    const input = page.locator('[data-testid="field-simple"] [data-testid="string-input"]')

    const samples = await input.evaluate((el: HTMLInputElement) =>
      window.perf.typingTest(el, {samples: 2}),
    )

    await new Promise((resolve) => setTimeout(resolve, 1000))

    await client
      .transaction()
      .delete(documentId)
      .delete(`drafts.${documentId}`)
      .commit({visibility: 'async'})
    return {
      lagPerKeystroke: Math.min(...samples.map((sample) => sample.lagPerKeystroke)),
      timePerKeyStroke: Math.min(...samples.map((sample) => sample.timePerKeyStroke)),
    }
  },
} satisfies PerformanceTestProps<{lagPerKeystroke: number; timePerKeyStroke: number}>
