import {uuid} from '@sanity/uuid'
import {Page} from '@playwright/test'
import {PerformanceTestContext, PerformanceTestProps} from '../runner/types'
import {KNOWN_TEST_IDS} from '../runner/utils/testIds'

export default {
  id: KNOWN_TEST_IDS['deeply-nested-objects-test'],
  name: 'Typing speed test in a deeply nested field',
  description: `
  This test measures the typing speed of a deeply nested text field.
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

    await page.goto(`${url}/desk/deepObject;${documentId}`)

    // Wait for the form to render
    await page.waitForSelector('[data-testid="string-input"]')

    const inputTestId =
      'field-deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.deep.title'

    if ((await page.getByTestId(inputTestId).count()) === 0) {
      // The fieldsets are collapsed, so we need to open them
      await openFieldsets(page, 17)
    }

    const input = await page.getByTestId(inputTestId).getByTestId('string-input')

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

async function openFieldsets(page: Page, depth: number) {
  const currentPath = []
  while (currentPath.length < depth) {
    currentPath.push('deep')
    await page
      .getByTestId(`field-deep.deep.${currentPath.join('.')}`)
      .getByRole('button', {name: 'Deep'})
      .last()
      .click()
  }
}
