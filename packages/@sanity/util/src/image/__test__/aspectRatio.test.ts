import {describe, expect, it} from 'vitest'

import {
  clampRatio,
  describeAspectRatio,
  formatAspectRatio,
  FREE_ASPECT_RATIO_RANGE,
  nearestRatio,
  ratioMatchesConstraint,
  resolveAspectRatio,
} from '../aspectRatio'

const RANGE = {min: 4 / 3, max: 16 / 9}

describe('resolveAspectRatio', () => {
  it('falls back to the free range for undefined', () => {
    expect(resolveAspectRatio(undefined)).toEqual({range: FREE_ASPECT_RATIO_RANGE})
  })

  it('locks a single number to an equal-bounds range', () => {
    expect(resolveAspectRatio(1.5)).toEqual({range: {min: 1.5, max: 1.5}})
  })

  it('passes a range through unchanged', () => {
    expect(resolveAspectRatio({min: 1, max: 2})).toEqual({range: {min: 1, max: 2}})
  })

  it('derives bounds and sorted, de-duplicated snap ratios from an array', () => {
    expect(resolveAspectRatio([16 / 9, 1, 4 / 3, 1])).toEqual({
      range: {min: 1, max: 16 / 9},
      snapRatios: [1, 4 / 3, 16 / 9],
    })
  })

  it('reduces a one-element array to a fixed ratio', () => {
    expect(resolveAspectRatio([1.5])).toEqual({range: {min: 1.5, max: 1.5}, snapRatios: [1.5]})
  })
})

describe('clampRatio', () => {
  it('passes ratios already inside the range through unchanged', () => {
    expect(clampRatio(1.5, RANGE)).toBeCloseTo(1.5)
  })

  it('clamps to the nearest bound', () => {
    expect(clampRatio(1, RANGE)).toBeCloseTo(RANGE.min)
    expect(clampRatio(3, RANGE)).toBeCloseTo(RANGE.max)
  })
})

describe('nearestRatio', () => {
  const ratios = [1, 4 / 3, 16 / 9]

  it('returns the closest member', () => {
    expect(nearestRatio(1.01, ratios)).toBe(1)
    expect(nearestRatio(1.35, ratios)).toBe(4 / 3)
    expect(nearestRatio(1.7, ratios)).toBe(16 / 9)
  })

  it('snaps values outside the spread to the nearest extreme', () => {
    expect(nearestRatio(0.2, ratios)).toBe(1)
    expect(nearestRatio(5, ratios)).toBe(16 / 9)
  })

  it('returns the sole member of a one-element list', () => {
    expect(nearestRatio(3, [1.5])).toBe(1.5)
  })
})

describe('ratioMatchesConstraint', () => {
  it('matches a fixed ratio within the rounding tolerance', () => {
    const fixed = resolveAspectRatio(16 / 9)
    expect(ratioMatchesConstraint(16 / 9, fixed)).toBe(true)
    expect(ratioMatchesConstraint(1600 / 896, fixed)).toBe(true)
    expect(ratioMatchesConstraint(1.5, fixed)).toBe(false)
  })

  it('matches a ratio inside a range and rejects one outside it', () => {
    const range = resolveAspectRatio(RANGE)
    expect(ratioMatchesConstraint(1.5, range)).toBe(true)
    expect(ratioMatchesConstraint(1, range)).toBe(false)
    expect(ratioMatchesConstraint(2, range)).toBe(false)
  })

  it('matches a snap-list member and rejects a ratio between members', () => {
    const snap = resolveAspectRatio([1, 16 / 9])
    expect(ratioMatchesConstraint(1, snap)).toBe(true)
    expect(ratioMatchesConstraint(16 / 9, snap)).toBe(true)
    expect(ratioMatchesConstraint(1.5, snap)).toBe(false)
  })

  it('accepts a custom tolerance', () => {
    expect(ratioMatchesConstraint(1.1, resolveAspectRatio(1), 0.2)).toBe(true)
  })
})

describe('formatAspectRatio', () => {
  it('prefers a clean width:height label', () => {
    expect(formatAspectRatio(16 / 9)).toBe('16:9')
    expect(formatAspectRatio(4 / 3)).toBe('4:3')
    expect(formatAspectRatio(3 / 2)).toBe('3:2')
    expect(formatAspectRatio(1)).toBe('1:1')
    expect(formatAspectRatio(9 / 16)).toBe('9:16')
  })

  it('falls back to a decimal rather than an awkward whole-number pair', () => {
    expect(formatAspectRatio(2.35)).toBe('2.35:1')
  })
})

describe('describeAspectRatio', () => {
  it('describes a fixed ratio', () => {
    expect(describeAspectRatio(resolveAspectRatio(16 / 9))).toBe('16:9')
  })

  it('describes a range', () => {
    expect(describeAspectRatio(resolveAspectRatio(RANGE))).toBe('between 4:3 and 16:9')
  })

  it('lists every member of a snap list', () => {
    expect(describeAspectRatio(resolveAspectRatio([16 / 9, 1, 4 / 3]))).toBe('1:1, 4:3 or 16:9')
    expect(describeAspectRatio(resolveAspectRatio([1, 16 / 9]))).toBe('1:1 or 16:9')
  })

  it('describes a one-member snap list as a fixed ratio', () => {
    expect(describeAspectRatio(resolveAspectRatio([1]))).toBe('1:1')
  })
})
