import {afterEach, describe, expect, it, vi} from 'vitest'

async function loadSamplingWithRoll(roll: number) {
  vi.resetModules()
  vi.spyOn(Math, 'random').mockReturnValue(roll)
  return import('../softNavigationSampling')
}

describe('isSessionSampled', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('samples a page load whose roll falls under the rate', async () => {
    const {isSessionSampled} = await loadSamplingWithRoll(0.05)

    expect(isSessionSampled(0.1)).toBe(true)
  })

  it('leaves out a page load whose roll is at or over the rate', async () => {
    const {isSessionSampled} = await loadSamplingWithRoll(0.1)

    expect(isSessionSampled(0.1)).toBe(false)
  })

  it('samples every page load at a rate of 1 and none at 0', async () => {
    const {isSessionSampled} = await loadSamplingWithRoll(0)

    expect(isSessionSampled(1)).toBe(true)
    expect(isSessionSampled(0)).toBe(false)
  })
})
