import {createSessionId} from '@sanity/telemetry'
import {describe, expect, it} from 'vitest'

import {isSessionSampled} from '../softNavigationSampling'

describe('isSessionSampled', () => {
  it('gives the same answer for a session every time', () => {
    const sessionId = createSessionId()

    const answers = Array.from({length: 5}, () => isSessionSampled(sessionId, 0.1))

    expect(new Set(answers).size).toBe(1)
  })

  it('samples close to the requested share of sessions', () => {
    const sessionIds = Array.from({length: 20_000}, () => createSessionId())

    const sampledShare =
      sessionIds.filter((sessionId) => isSessionSampled(sessionId, 0.1)).length / sessionIds.length

    expect(sampledShare).toBeGreaterThan(0.09)
    expect(sampledShare).toBeLessThan(0.11)
  })

  it('samples every session at a rate of 1 and none at 0', () => {
    const sessionId = createSessionId()

    expect(isSessionSampled(sessionId, 1)).toBe(true)
    expect(isSessionSampled(sessionId, 0)).toBe(false)
  })
})
