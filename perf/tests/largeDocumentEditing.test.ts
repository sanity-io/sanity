import {PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'
import {generateParagraphs} from './helpers/utils/generateParagraphs'

export default {
  id: KNOWN_TEST_IDS['large-document-editing'],
  name: 'Performance test of large document editing',
  description: `
  This test measures the general performance of editing a large document.
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
    const largeDocument = {
      _type: 'largeDocument',
      contentBlocks: [
        {
          _key: '6940e3f8979b',
          children: [
            {
              _type: 'span',
              marks: [],
              text: generateParagraphs(3),
              _key: 'fcdf7023391c0',
            },
          ],
          markDefs: [],
          _type: 'block',
          style: 'normal',
        },
      ],
      listContent: {
        dateWritten: '2023-04-03',
        description: generateParagraphs(700),
        title: 'officia est commodo duis',
      },
      meta: {
        description: generateParagraphs(650),
        title: 'officia est commodo duis',
      },
      slug: {
        _type: 'slug',
        current: 'officia-est-commodo-duis',
      },
      subdirectory: 'officia est commodo duis',
    }
    const doc = await client.create(largeDocument)
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

    await page.goto(`${url}/desk/largeDocument;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')

    const input = await page.getByTestId('field-listContent.title').getByTestId('string-input')

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
