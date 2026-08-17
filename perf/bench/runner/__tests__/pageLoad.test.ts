// @vitest-environment node
import {describe, expect, it} from 'vitest'

import {deriveAuthMilestones, unionDurationMs} from '../session/pageLoad'

describe('unionDurationMs', () => {
  it('sums disjoint windows', () => {
    expect(
      unionDurationMs([
        {start: 0, end: 10},
        {start: 20, end: 25},
      ]),
    ).toBe(15)
  })

  it('counts overlapping windows once (concurrent auth requests)', () => {
    expect(
      unionDurationMs([
        {start: 0, end: 10},
        {start: 5, end: 15},
        {start: 12, end: 14},
      ]),
    ).toBe(15)
  })

  it('handles empty input', () => {
    expect(unionDurationMs([])).toBe(0)
  })
})

describe('deriveAuthMilestones', () => {
  const API = 'https://localhost:4311'

  it('classifies users/me and auth/* like the mock ledger, ignoring other requests', () => {
    const auth = deriveAuthMilestones(
      [
        {url: `${API}/v2025-02-19/users/me`, startTime: 100, responseEnd: 140},
        {url: `${API}/v2025-02-19/auth/providers`, startTime: 150, responseEnd: 170},
        {url: `${API}/v2025-02-19/data/query/bench?query=x`, startTime: 90, responseEnd: 300},
        {url: `${API}/v2025-02-19/users/me/keyvalue/foo`, startTime: 200, responseEnd: 220},
        {url: 'https://localhost:4310/static/sanity-abc.js', startTime: 10, responseEnd: 50},
      ],
      1000,
    )
    // keyvalue is UI-state persistence, not auth (mirrors the mock's classes)
    expect(auth).toEqual({trips: 2, firstRequestMs: 100, inFlightMs: 60})
  })

  it('only counts requests completed before the form became editable', () => {
    const auth = deriveAuthMilestones(
      [
        {url: `${API}/v1/users/me`, startTime: 100, responseEnd: 140},
        {url: `${API}/v1/auth/providers`, startTime: 900, responseEnd: 1100},
      ],
      1000,
    )
    expect(auth.trips).toBe(1)
  })

  it('reports null first-request when no auth requests happened', () => {
    expect(deriveAuthMilestones([], 1000)).toEqual({
      trips: 0,
      firstRequestMs: null,
      inFlightMs: 0,
    })
  })
})
