import {type ImageCropDimensions} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {resolveAspectRatio} from '../aspectRatio'
import {defaultCropRect, largestRectForRatio, largestSizeForRatio} from '../defaultCrop'

const RANGE = resolveAspectRatio({min: 4 / 3, max: 16 / 9})
const SNAP = resolveAspectRatio([4 / 3, 16 / 9])

function ratioOf(rect: {width: number; height: number}) {
  return rect.width / rect.height
}

describe('largestSizeForRatio', () => {
  it('fills the width when the bounds are taller than the ratio', () => {
    expect(largestSizeForRatio({width: 1000, height: 3000}, 4 / 3)).toEqual({
      width: 1000,
      height: 750,
    })
  })

  it('fills the height exactly when the bounds are wider than the ratio', () => {
    expect(largestSizeForRatio({width: 318, height: 114}, 2.35)).toEqual({
      width: 114 * 2.35,
      height: 114,
    })
  })
})

describe('largestRectForRatio', () => {
  it('fills the height and centres horizontally when the source is wider than the ratio', () => {
    expect(largestRectForRatio({width: 3000, height: 1000}, 1)).toEqual({
      x: 1000,
      y: 0,
      width: 1000,
      height: 1000,
    })
  })

  it('fills the width and centres vertically when the source is taller than the ratio', () => {
    expect(largestRectForRatio({width: 1000, height: 3000}, 1)).toEqual({
      x: 0,
      y: 1000,
      width: 1000,
      height: 1000,
    })
  })

  it('stays inside the source when the height limits the ratio', () => {
    const rect = largestRectForRatio({width: 318, height: 114}, 2.35)
    expect(rect.y).toBe(0)
    expect(rect.height).toBe(114)
  })
})

describe('defaultCropRect', () => {
  it('uses the whole image when its ratio is already in range', () => {
    const source: ImageCropDimensions = {width: 1600, height: 900}
    const rect = defaultCropRect(source, RANGE)
    expect(rect.x).toBeCloseTo(0)
    expect(rect.y).toBeCloseTo(0)
    expect(rect.width).toBeCloseTo(1600)
    expect(rect.height).toBeCloseTo(900)
  })

  it('clamps to the allowed ratio and centres when the image is too wide', () => {
    const rect = defaultCropRect({width: 3000, height: 1000}, RANGE)
    expect(ratioOf(rect)).toBeCloseTo(16 / 9)
    expect(rect.y).toBe(0)
    expect(rect.height).toBe(1000)
    expect(rect.x).toBeCloseTo((3000 - rect.width) / 2)
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(3000)
  })

  it('clamps to the allowed ratio and centres when the image is too tall', () => {
    const rect = defaultCropRect({width: 1000, height: 1000}, RANGE)
    expect(ratioOf(rect)).toBeCloseTo(4 / 3)
    expect(rect.x).toBe(0)
    expect(rect.width).toBe(1000)
    expect(rect.y).toBeCloseTo((1000 - rect.height) / 2)
  })

  it('targets the listed ratio nearest the source ratio', () => {
    expect(ratioOf(defaultCropRect({width: 1000, height: 1000}, SNAP))).toBeCloseTo(4 / 3)
  })

  it('snaps a source ratio between the listed ratios to the nearest one', () => {
    expect(ratioOf(defaultCropRect({width: 1500, height: 1000}, SNAP))).toBeCloseTo(4 / 3)
  })

  it('picks a wider listed ratio for a wide source', () => {
    expect(ratioOf(defaultCropRect({width: 3000, height: 1000}, SNAP))).toBeCloseTo(16 / 9)
  })
})

describe('defaultCropRect on tiny sources', () => {
  const TINY_SOURCES: ImageCropDimensions[] = [
    {width: 1, height: 1},
    {width: 7, height: 5},
    {width: 2, height: 1000},
  ]
  const CONSTRAINTS = [16 / 9, 4, 1 / 4, {min: 4 / 3, max: 16 / 9}, [1 / 3, 3]].map((aspectRatio) =>
    resolveAspectRatio(aspectRatio),
  )
  const CASES = TINY_SOURCES.flatMap((source) =>
    CONSTRAINTS.map((constraint) => ({source, constraint})),
  )

  it.each(CASES)(
    'keeps a $source.width × $source.height crop at least a pixel on each axis',
    ({source, constraint}) => {
      const rect = defaultCropRect(source, constraint)
      expect(rect.width).toBeGreaterThanOrEqual(1)
      expect(rect.height).toBeGreaterThanOrEqual(1)
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(source.width)
      expect(rect.y + rect.height).toBeLessThanOrEqual(source.height)
    },
  )
})
