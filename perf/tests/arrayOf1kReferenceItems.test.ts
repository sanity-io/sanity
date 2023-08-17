import {range} from 'lodash'
import {PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['array-of-1k-reference-items'],
  name: 'Performance test of array with 1k reference items',
  description: `
  This test measures the general performance of an array with 1k reference items.
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
    const referenceItem = {
      _type: 'deepArrayReference',
      text: 'Reference item',
    }

    const refDoc = await client.create(referenceItem)

    const arrayOf1kReferenceItems = {
      _type: 'deepArrayReference',
      text: 'Array with many items',
      deep: range(1000).map((i) => ({
        _key: `item-${i}`,
        _type: 'reference',
        _ref: refDoc._id,
      })),
    }
    const doc = await client.create(arrayOf1kReferenceItems)
    return {
      data: {documentId: doc._id},
      teardown: async () => {
        await Promise.all([client.delete(doc._id), client.delete(`drafts.${doc._id}`)])
        return client.delete(refDoc._id, {skipCrossDatasetReferenceValidation: true})
      },
    }
  },
  version: 1,
  async run({page, url, setupData}) {
    const documentId = setupData.documentId

    await page.goto(`${url}/desk/deepArrayReference;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')
    await page.getByRole('button', {name: 'Add item'}).click()

    const input = await page.getByTestId('autocomplete')
    await input.click()

    const samples = await input.evaluate((el: HTMLInputElement) =>
      window.perf.typingTest(el, {samples: 1}),
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
