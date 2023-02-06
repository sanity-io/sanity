import {uuid} from '@sanity/uuid'
import {PerformanceTestContext, PerformanceTestProps} from '../types'

export default {
  name: 'Simple typing speed test',
  async run({page, client, url}: PerformanceTestContext) {
    const documentId = uuid()
    await page.goto(`${url}/desk/simple;${documentId}`, {
      // This is needed on CI servers with restricted resources because it takes a long time to compile the studio js
      timeout: 1000 * 60 * 5,
    })

    const input = page.locator('[data-testid="field-simple"] [data-testid="string-input"]')
    // clear the input value first
    await input.evaluate((el: HTMLInputElement) => {
      el.value = ''
    })

    const samples = await input.evaluate((el: HTMLInputElement) =>
      window.perf.typingTest(el, {iterations: 1})
    )

    await Promise.all([client.delete(`drafts.${documentId}`), client.delete(documentId)])

    return {result: samples.reduce((lag, sample) => lag + sample.lag, 0)}
  },
} satisfies PerformanceTestProps
