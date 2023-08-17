import {range} from 'lodash'
import {PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['large-array-editing-another-field'],
  name: 'Performance test of array with 200 items and editing another field',
  description: `
  This test measures the general performance of an array with 200 items. It also measures the performance of editing another field.
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
    const arrayOf1kItems = {
      _type: 'deepArray',
      text: 'Array with 200 items',
      deep: range(200).map((i) => ({
        _key: `item-${i}`,
        _type: 'deepArray',
        text: `Item ${i}`,
      })),
    }
    const doc = await client.create(arrayOf1kItems)
    return {
      data: {documentId: doc._id},
      teardown: () =>
        client
          .transaction()
          .delete(doc._id)
          .delete(`drafts.${doc._id}`)
          .commit({visibility: 'async'}),
    }
  },
  version: 1,
  async run({page, url, setupData}) {
    const documentId = setupData.documentId

    await page.goto(`${url}/desk/deepArray;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')

    const input = await page.getByTestId('string-input')
    await input.click()

    const samples = await input.evaluate((el: HTMLInputElement) =>
      window.perf.typingTest(el, {chars: 'abc', samples: 1}),
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
