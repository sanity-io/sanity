import {triggerEditEvent} from './utils/triggerEdit'

const LAG_CHECK_MS = 16 // ~60fps
interface Sample {
  lagPerKeystroke: number
  timePerKeyStroke: number
}
export async function typingTest(
  inputElement: HTMLElement,
  options: {samples?: number; gracePeriod?: number; chars?: string} = {},
): Promise<Sample[]> {
  const {
    samples: sampleCount = 10,
    gracePeriod = 100,
    chars = 'abcdefghijklmnopqrstuvwxyz',
  } = options
  const samples = []
  for (let i = 0; i < sampleCount; i++) {
    samples.push(await sample(inputElement, gracePeriod, chars))
  }
  return samples
}

async function sample(
  inputElement: HTMLElement,
  gracePeriod = 100,
  chars = 'abcdefghijklmnopqrstuvwxyz',
): Promise<Sample> {
  let totalLag = 0
  let totalDuration = 0

  let lastLagCheck = performance.now()
  const lagInterval = setInterval(function checkLag() {
    const now = performance.now()
    // In case we fire before the timer is supposed to run, this is fine
    const lag = Math.max(0, now - lastLagCheck - LAG_CHECK_MS)
    totalLag += lag
    lastLagCheck = now
  }, LAG_CHECK_MS)

  for (let i = 0; i < chars.length; i++) {
    const newValue = `Typing ${chars.slice(0, i + 1)}`
    const start = performance.now()
    triggerEditEvent(inputElement, newValue)
    totalDuration += performance.now() - start
    // cooldown period after trigger event. This will reflect on the total duration of the tests, but not on the lag
    await new Promise((resolve) => setTimeout(resolve, gracePeriod))
  }
  clearInterval(lagInterval)

  return {timePerKeyStroke: totalDuration / chars.length, lagPerKeystroke: totalLag / chars.length}
}
