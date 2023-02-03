import {uuid} from '@sanity/uuid'
import {PerformanceTestContext, PerformanceTestProps} from '../types'

async function test({page, client, url}: PerformanceTestContext) {
  const documentId = uuid()
  await page.goto(`${url}/test/content/input-standard;stringsTest;${documentId}`, {
    // This is needed on CI servers with restricted resources because it takes a long time to compile the studio js
    timeout: 1000 * 60 * 5,
  })

  const input = page.locator('[data-testid="string-input"]').first()

  // clear the input value first
  await input.evaluate((el: HTMLInputElement) => {
    el.value = ''
  })

  const startTime = new Date().getTime()
  await input.type(`${new Date().toISOString()}- abcdefghijklmnopqrstuvwxyz`)

  const elapsedTime = new Date().getTime() - startTime

  await client.delete(`drafts.${documentId}`)

  return {result: elapsedTime}
}

export const simpleTypingTest: PerformanceTestProps = {
  name: 'Simple typing speed test',
  run: test,
}
