import {type Page} from 'playwright'

const BLOCKING_TASK_THRESHOLD = 50

export function measureBlockingTime(page: Page): () => Promise<number> {
  const idleGapLengthsPromise = page
    .evaluate(
      // Had to add this so we can run the tests
      new Function(`
    return (async function() {
      const idleGapLengths = []
      const done = false
      let last = performance.now()

      const handler = () => {
        const current = performance.now()
        idleGapLengths.push(current - last)
        last = current

        if (done) return
        requestAnimationFrame(handler)
      }

      requestAnimationFrame(handler)

      await new Promise((resolve) => {
        document.addEventListener('__blockingTimeFinish', resolve, {once: true})
      })

      return idleGapLengths
    })()
  `) as () => Promise<number[]>,
    )
    // This evaluate starts running immediately (before it is awaited in
    // `getBlockingTime`). If the page/context is torn down first — e.g. the
    // A/B harness closes browsers after one side fails — this promise would
    // otherwise reject with no handler attached, surfacing as an *unhandled
    // rejection* that crashes the whole process and bypasses the per-attempt
    // retry machinery. Swallow that here so the failure stays catchable.
    .catch((): number[] => [])

  async function getBlockingTime() {
    await page
      .evaluate(
        new Function(`
      document.dispatchEvent(new CustomEvent('__blockingTimeFinish'))
    `) as () => void,
      )
      .catch(() => {})

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
