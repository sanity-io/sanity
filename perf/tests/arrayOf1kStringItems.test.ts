import {range} from 'lodash'
import {PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['array-of-1k-string-items'],
  name: 'Performance test of array with 1k string items',
  description: `
  This test measures the general performance of an array with 1k string items.
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
  async setup({client}) {
    const arrayOf1kStringItems = {
      _type: 'deepArrayString',
      text: 'Array with many items',
      deep: range(1000).map((i) => `Item ${i}`),
    }
    const doc = await client.create(arrayOf1kStringItems)
    return {
      data: {documentId: doc._id},
      teardown: () => client.delete(doc._id),
    }
  },
  version: 1,
  async run({page, url, setupData}) {
    const documentId = setupData.documentId

    await page.goto(`${url}/desk/deepArrayString;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')

    const input = await page.getByTestId('string-input').nth(1)
    await input.click()

    const samples = await input.evaluate((el: HTMLInputElement) =>
      window.perf.typingTest(el, {samples: 1})
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      lagPerKeystroke: Math.min(...samples.map((sample) => sample.lagPerKeystroke)),
      timePerKeyStroke: Math.min(...samples.map((sample) => sample.timePerKeyStroke)),
    }
  },
} satisfies PerformanceTestProps<
  {lagPerKeystroke: number; timePerKeyStroke: number},
  {documentId: string}
>
