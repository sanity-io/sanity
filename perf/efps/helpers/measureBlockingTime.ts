import {type Page} from 'playwright'

const BLOCKING_TASK_THRESHOLD = 50

export function measureBlockingTime(page: Page): () => Promise<number> {
  const idleGapLengthsPromise = page.evaluate(async () => {
    const idleGapLengths: number[] = []
    const done = false
    let last = performance.now()

    const handler = () => {
      const current = performance.now()
      idleGapLengths.push(current - last)
      last = current

      if (done) return
      requestIdleCallback(handler)
    }

    requestIdleCallback(handler)

    await new Promise((resolve) => {
      document.addEventListener('__blockingTimeFinish', resolve, {once: true})
    })

    return idleGapLengths
  })

  async function getBlockingTime() {
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('__blockingTimeFinish'))
    })

    const idleGapLengths = await idleGapLengthsPromise

    const blockingTime = idleGapLengths
      // only consider the gap lengths that are blocking
      .filter((idleGapLength) => idleGapLength > BLOCKING_TASK_THRESHOLD)
      // subtract the allowed time so we're only left with blocking time
      .map((idleGapLength) => idleGapLength - BLOCKING_TASK_THRESHOLD)
      .reduce((sum, next) => sum + next, 0)

    return blockingTime
  }

  return getBlockingTime
}
