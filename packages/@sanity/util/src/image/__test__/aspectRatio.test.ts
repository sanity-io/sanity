import {describe, expect, it} from 'vitest'

import {
  describeAspectRatio,
  dimensionsMatchConstraint,
  formatAspectRatio,
  nearestAllowedRatio,
  ratioMatchesConstraint,
  resolveAspectRatio,
} from '../aspectRatio'

const RANGE = {min: 4 / 3, max: 16 / 9}

describe('resolveAspectRatio', () => {
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

describe('nearestAllowedRatio', () => {
  it('returns the ratio unchanged without a constraint', () => {
    expect(nearestAllowedRatio(0.001, undefined)).toBe(0.001)
    expect(nearestAllowedRatio(250, undefined)).toBe(250)
  })

  it('passes a ratio inside a range through and clamps one outside it to the nearest bound', () => {
    const range = resolveAspectRatio(RANGE)
    expect(nearestAllowedRatio(1.5, range)).toBe(1.5)
    expect(nearestAllowedRatio(1, range)).toBe(RANGE.min)
    expect(nearestAllowedRatio(3, range)).toBe(RANGE.max)
  })

  it('locks every ratio to a fixed ratio', () => {
    expect(nearestAllowedRatio(0.5, resolveAspectRatio(16 / 9))).toBe(16 / 9)
    expect(nearestAllowedRatio(3, resolveAspectRatio(16 / 9))).toBe(16 / 9)
  })

  it('snaps to the nearest listed ratio, ignoring the values between them', () => {
    const snap = resolveAspectRatio([16 / 9, 1, 4 / 3])
    expect(nearestAllowedRatio(1.01, snap)).toBe(1)
    expect(nearestAllowedRatio(1.5, snap)).toBe(4 / 3)
    expect(nearestAllowedRatio(1.7, snap)).toBe(16 / 9)
    expect(nearestAllowedRatio(0.2, snap)).toBe(1)
    expect(nearestAllowedRatio(5, snap)).toBe(16 / 9)
  })

  it('returns the sole member of a one-element list', () => {
    expect(nearestAllowedRatio(3, resolveAspectRatio([1.5]))).toBe(1.5)
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

describe('dimensionsMatchConstraint', () => {
  it('matches whole-pixel sizes that rounding moved off a fixed ratio', () => {
    const fixed = resolveAspectRatio(16 / 9)
    expect(dimensionsMatchConstraint({width: 1600, height: 900}, fixed)).toBe(true)
    expect(dimensionsMatchConstraint({width: 36, height: 20}, fixed)).toBe(true)
    expect(dimensionsMatchConstraint({width: 27, height: 20}, fixed)).toBe(false)
    expect(dimensionsMatchConstraint({width: 10, height: 0}, fixed)).toBe(false)
  })

  it('matches a near-square size and rejects a different ratio', () => {
    const square = resolveAspectRatio(1)
    expect(dimensionsMatchConstraint({width: 53, height: 52}, square)).toBe(true)
    expect(dimensionsMatchConstraint({width: 1200, height: 900}, square)).toBe(false)
  })

  it('matches a size inside a range and rejects one outside it', () => {
    const range = resolveAspectRatio(RANGE)
    expect(dimensionsMatchConstraint({width: 150, height: 100}, range)).toBe(true)
    expect(dimensionsMatchConstraint({width: 100, height: 100}, range)).toBe(false)
    expect(dimensionsMatchConstraint({width: 200, height: 100}, range)).toBe(false)
  })

  it('matches a snap-list member and rejects a size between members', () => {
    const snap = resolveAspectRatio([1, 16 / 9])
    expect(dimensionsMatchConstraint({width: 100, height: 100}, snap)).toBe(true)
    expect(dimensionsMatchConstraint({width: 36, height: 20}, snap)).toBe(true)
    expect(dimensionsMatchConstraint({width: 150, height: 100}, snap)).toBe(false)
  })

  it('accepts a custom tolerance', () => {
    expect(dimensionsMatchConstraint({width: 110, height: 100}, resolveAspectRatio(1), 0.2)).toBe(
      true,
    )
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
