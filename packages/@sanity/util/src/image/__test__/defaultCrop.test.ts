import {type ImageCropDimensions} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {resolveAspectRatio} from '../aspectRatio'
import {defaultCropRect, getDefaultImageCrop, largestRectForRatio} from '../defaultCrop'

const RANGE = resolveAspectRatio({min: 4 / 3, max: 16 / 9})
const SNAP = resolveAspectRatio([4 / 3, 16 / 9])

function ratioOf(rect: {width: number; height: number}) {
  return rect.width / rect.height
}

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

describe('getDefaultImageCrop', () => {
  it('crops an off-ratio image to the largest centered crop at the fixed ratio', () => {
    const crop = getDefaultImageCrop('image-a1b2c3d4e5f6-2000x1000-jpg', 1)
    expect(crop?._type).toBe('sanity.imageCrop')
    expect(crop?.left).toBeCloseTo(0.25)
    expect(crop?.right).toBeCloseTo(0.25)
    expect(crop?.top).toBeCloseTo(0)
    expect(crop?.bottom).toBeCloseTo(0)
  })

  it('crops to the nearest listed ratio', () => {
    const crop = getDefaultImageCrop('image-a1b2c3d4e5f6-1000x1000-jpg', [4 / 3, 16 / 9])
    expect(crop?.top).toBeCloseTo(0.125)
    expect(crop?.bottom).toBeCloseTo(0.125)
    expect(crop?.left).toBeCloseTo(0)
    expect(crop?.right).toBeCloseTo(0)
  })

  it('writes no crop when the source ratio already fits', () => {
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6-1600x900-jpg', 16 / 9)).toBeUndefined()
    expect(
      getDefaultImageCrop('image-a1b2c3d4e5f6-1200x800-jpg', {min: 4 / 3, max: 16 / 9}),
    ).toBeUndefined()
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6-1200x900-jpg', [1, 4 / 3])).toBeUndefined()
  })

  it('writes no crop without an aspect ratio', () => {
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6-2000x1000-jpg', undefined)).toBeUndefined()
  })

  it('writes no crop for an asset that cannot be cropped', () => {
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6-2000x1000-svg', 1)).toBeUndefined()
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6-svg', 1)).toBeUndefined()
    expect(getDefaultImageCrop('image-a1b2c3d4e5f6', 1)).toBeUndefined()
  })
})
