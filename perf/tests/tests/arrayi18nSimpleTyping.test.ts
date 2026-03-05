import {uuid} from '@sanity/uuid'

import {type PerformanceTestContext, type PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['arrayi18n-simple-typing-speed-test'],
  name: 'Array I18N simple typing speed test',
  description: `
  This test measures the typing speed of a simple text field in the Array I18N plugin. It's collecting results as a regression in percentage between the base branch and the current branch. A negative value means that the current branch is faster than the base branch.
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

    await page.goto(`${url}/desk/arrayI18n;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')

    // Find the button with `en`
    const enButton = page.getByRole('button', {name: 'en'})
    await enButton.click()

    const input = page.getByTestId('field-simple[_key=="en"].value').getByTestId('string-input')

    await input.click()

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
