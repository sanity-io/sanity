import {type ImageCrop} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  croppedDimensions,
  cropToPixelRect,
  dimensionsAtLeast,
  getCroppedImageDimensions,
  getImageRefDimensions,
  isCroppableImageRef,
  isSvgImageRef,
  pixelRectToCrop,
} from '../cropDimensions'

const ASSET_HASH = 'a75b03fdd5b5fa36947bf2b776a542e0c940f682'
const REF = `image-${ASSET_HASH}-1200x800-jpg`
const SVG_REF = `image-${ASSET_HASH}-1200x800-svg`
const ZERO_SIZE_REF = `image-${ASSET_HASH}-0x0-png`
const MALFORMED_REFS = [
  '',
  'image',
  `image-${ASSET_HASH}-svg`,
  `image-${ASSET_HASH}-jpg`,
  'image-a1-1200x800-jpg',
]

// A centered crop of REF, 50% wide and 80% tall: 600 × 640 px.
const CROP: ImageCrop = {_type: 'sanity.imageCrop', top: 0.1, bottom: 0.1, left: 0.25, right: 0.25}

function imageValue(ref: string, crop?: ImageCrop) {
  return {asset: {_type: 'reference', _ref: ref}, crop}
}

describe('isSvgImageRef', () => {
  it('matches an image-<hash>-<w>x<h>-svg reference', () => {
    expect(isSvgImageRef(SVG_REF)).toBe(true)
  })

  it('rejects raster, non-image, missing and malformed references', () => {
    expect(isSvgImageRef(REF)).toBe(false)
    expect(isSvgImageRef(`file-${ASSET_HASH}-svg`)).toBe(false)
    expect(isSvgImageRef(`image-${ASSET_HASH}-1200x800-png`)).toBe(false)
    expect(isSvgImageRef(undefined)).toBe(false)
    expect(MALFORMED_REFS.map(isSvgImageRef)).toEqual(MALFORMED_REFS.map(() => false))
  })
})

describe('getImageRefDimensions', () => {
  it('reads the pixel size encoded in the reference', () => {
    expect(getImageRefDimensions(REF)).toEqual({width: 1200, height: 800})
  })

  it('returns undefined for SVGs, file references and missing references', () => {
    expect(getImageRefDimensions(SVG_REF)).toBeUndefined()
    expect(getImageRefDimensions(`file-${ASSET_HASH}-pdf`)).toBeUndefined()
    expect(getImageRefDimensions(undefined)).toBeUndefined()
  })

  it('returns undefined for malformed references', () => {
    expect(MALFORMED_REFS.map(getImageRefDimensions)).toEqual(MALFORMED_REFS.map(() => undefined))
  })

  it('returns undefined for a zero-size reference instead of 0 × 0', () => {
    expect(getImageRefDimensions(ZERO_SIZE_REF)).toBeUndefined()
    expect(getImageRefDimensions(`image-${ASSET_HASH}-1200x0-png`)).toBeUndefined()
  })
})

describe('isCroppableImageRef', () => {
  it('accepts references with encoded dimensions', () => {
    expect(isCroppableImageRef(REF)).toBe(true)
    expect(isCroppableImageRef(`image-${ASSET_HASH}-1200x800-webp`)).toBe(true)
  })

  it('rejects SVGs, zero-size, missing and malformed references', () => {
    expect(isCroppableImageRef(SVG_REF)).toBe(false)
    expect(isCroppableImageRef(ZERO_SIZE_REF)).toBe(false)
    expect(isCroppableImageRef(undefined)).toBe(false)
    expect(MALFORMED_REFS.map(isCroppableImageRef)).toEqual(MALFORMED_REFS.map(() => false))
  })
})

describe('pixelRectToCrop / cropToPixelRect', () => {
  it("round-trips a rectangle through Sanity's fractional crop", () => {
    const source = {width: 2000, height: 1500}
    const rect = {x: 200, y: 150, width: 1200, height: 900}
    const roundTripped = cropToPixelRect(pixelRectToCrop(rect, source), source)
    expect(roundTripped.x).toBeCloseTo(rect.x)
    expect(roundTripped.y).toBeCloseTo(rect.y)
    expect(roundTripped.width).toBeCloseTo(rect.width)
    expect(roundTripped.height).toBeCloseTo(rect.height)
  })

  it('produces non-negative insets that describe the same crop', () => {
    const crop = pixelRectToCrop(
      {x: 0, y: 0, width: 1000, height: 500},
      {width: 1000, height: 1000},
    )
    expect(crop.top).toBe(0)
    expect(crop.left).toBe(0)
    expect(crop.right).toBe(0)
    expect(crop.bottom).toBeCloseTo(0.5)
  })
})

describe('croppedDimensions / dimensionsAtLeast', () => {
  it('rounds the rectangle size', () => {
    expect(croppedDimensions({x: 0, y: 0, width: 199.6, height: 100.2})).toEqual({
      width: 200,
      height: 100,
    })
  })

  it('compares both axes against a threshold', () => {
    const threshold = {width: 800, height: 600}
    expect(dimensionsAtLeast({width: 800, height: 600}, threshold)).toBe(true)
    expect(dimensionsAtLeast({width: 799, height: 600}, threshold)).toBe(false)
    expect(dimensionsAtLeast({width: 800, height: 599}, threshold)).toBe(false)
  })
})

describe('getCroppedImageDimensions', () => {
  it('returns undefined for missing or asset-less values', () => {
    expect(getCroppedImageDimensions(undefined)).toBeUndefined()
    expect(getCroppedImageDimensions({})).toBeUndefined()
  })

  it('returns undefined for SVGs', () => {
    expect(getCroppedImageDimensions(imageValue(`image-${ASSET_HASH}-svg`))).toBeUndefined()
    expect(
      getCroppedImageDimensions(imageValue(`image-${ASSET_HASH}-1200x800-svg`)),
    ).toBeUndefined()
  })

  it('returns the source size when there is no crop', () => {
    expect(getCroppedImageDimensions(imageValue(REF))).toEqual({width: 1200, height: 800})
  })

  it('applies the stored crop to the source size', () => {
    expect(getCroppedImageDimensions(imageValue(REF, CROP))).toEqual({width: 600, height: 640})
  })

  it('ignores an incomplete crop', () => {
    const partialCrop = {top: 0.5} as ImageCrop
    expect(getCroppedImageDimensions(imageValue(REF, partialCrop))).toEqual({
      width: 1200,
      height: 800,
    })
  })
})
