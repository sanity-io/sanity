// @vitest-environment node
import {describe, expect, it} from 'vitest'

import {OBSERVABILITY_FLOOR_MS, padToFloor} from '../session/interaction'

describe('padToFloor', () => {
  it('pads missing interactions with the observability floor', () => {
    expect(padToFloor([10, 20], 5)).toEqual([
      10,
      20,
      OBSERVABILITY_FLOOR_MS,
      OBSERVABILITY_FLOOR_MS,
      OBSERVABILITY_FLOOR_MS,
    ])
  })

  it('pads nothing when observed already matches driven', () => {
    expect(padToFloor([10, 20], 2)).toEqual([10, 20])
  })

  it('clamps to no padding when observed exceeds driven', () => {
    expect(padToFloor([10, 20, 30], 2)).toEqual([10, 20, 30])
  })
})
