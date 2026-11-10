import {isHotspotEnabled, isImageToolEnabled} from '@sanity/schema/_internal'
import {
  defineType,
  type Image,
  type ImageCrop,
  type ImageOptions,
  type ObjectSchemaType,
} from '@sanity/types'
import {
  dimensionsAtLeast,
  dimensionsMatchConstraint,
  getCroppedImageDimensions,
  resolveAspectRatio,
} from '@sanity/util/image'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../schema/createSchema'
import {getImageToolPath, getInitialToolCrop} from '../imageToolOptions'

const IMAGE_OPTIONS: Record<string, ImageOptions | undefined> = {
  plain: undefined,
  hotspot: {hotspot: true},
  aspectRatio: {aspectRatio: 1},
  minDimensions: {minDimensions: {width: 10, height: 10}},
}

const schema = createSchema({
  name: 'images',
  types: Object.entries(IMAGE_OPTIONS).map(([name, options]) =>
    defineType({name: `${name}Image`, type: 'image', options}),
  ),
})

function getHiddenToolFields(name: string) {
  const type = schema.get(`${name}Image`) as ObjectSchemaType
  return Object.fromEntries(
    type.fields
      .filter((field) => field.name === 'hotspot' || field.name === 'crop')
      .map((field) => [field.name, field.type.hidden === true]),
  )
}

describe('image tool options', () => {
  test.each([
    {name: 'plain', enabled: false, hotspot: false, path: ['crop']},
    {name: 'hotspot', enabled: true, hotspot: true, path: ['hotspot']},
    {name: 'aspectRatio', enabled: true, hotspot: false, path: ['crop']},
    {name: 'minDimensions', enabled: true, hotspot: false, path: ['crop']},
  ])('resolves the tool for a $name image', ({name, enabled, hotspot, path}) => {
    const options = IMAGE_OPTIONS[name]
    expect(isImageToolEnabled(options)).toBe(enabled)
    expect(isHotspotEnabled(options)).toBe(hotspot)
    expect(getImageToolPath(options)).toEqual(path)
  })

  test.each([
    {name: 'plain', hidden: {hotspot: true, crop: true}},
    {name: 'hotspot', hidden: {hotspot: false, crop: false}},
    {name: 'aspectRatio', hidden: {hotspot: true, crop: false}},
    {name: 'minDimensions', hidden: {hotspot: true, crop: false}},
  ])('shows the field that owns the tool of a $name image', ({name, hidden}) => {
    expect(getHiddenToolFields(name)).toEqual(hidden)
  })
})

const ASSET_HASH = 'a75b03fdd5b5fa36947bf2b776a542e0c940f682'

function imageValue(size: string, crop?: ImageCrop, extension = 'jpg'): Partial<Image> {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: `image-${ASSET_HASH}-${size}-${extension}`},
    ...(crop && {crop}),
  }
}

function cropOf(top: number, right: number, bottom: number, left: number): ImageCrop {
  return {_type: 'sanity.imageCrop', top, right, bottom, left}
}

function withCrop(value: Partial<Image>, crop: ImageCrop | undefined): Partial<Image> {
  return {...value, crop}
}

describe('getInitialToolCrop', () => {
  const widescreen = resolveAspectRatio(16 / 9)

  test('fits a missing crop to the ratio', () => {
    const value = imageValue('1200x1800')
    const dimensions = getCroppedImageDimensions(
      withCrop(value, getInitialToolCrop(value, widescreen)),
    )
    expect(dimensions).toEqual({width: 1200, height: 675})
  })

  test('replaces a stored crop whose ratio fails the constraint', () => {
    const value = imageValue('1200x1800', cropOf(0, 0, 1 / 3, 0))
    const crop = getInitialToolCrop(value, widescreen)
    expect(crop).not.toEqual(value.crop)
    expect(
      dimensionsMatchConstraint(
        getCroppedImageDimensions(withCrop(value, crop)) ?? {width: 0, height: 0},
        widescreen,
      ),
    ).toBe(true)
  })

  test('keeps a stored crop that fits the constraint', () => {
    const crop = cropOf(0.1, 0, 0.525, 0)
    const value = imageValue('1200x1800', crop)
    expect(getInitialToolCrop(value, widescreen)).toBe(crop)
  })

  test('keeps a missing crop when the source already fits', () => {
    expect(getInitialToolCrop(imageValue('1600x900'), widescreen)).toBeUndefined()
  })

  test('keeps the stored crop without a ratio', () => {
    const crop = cropOf(0.1, 0.2, 0.3, 0.4)
    expect(getInitialToolCrop(imageValue('1200x1800', crop), undefined)).toBe(crop)
    expect(getInitialToolCrop(imageValue('1200x1800'), undefined)).toBeUndefined()
  })

  test.each([
    {name: 'an SVG', value: imageValue('1200x1800', undefined, 'svg')},
    {
      name: 'an unparsable reference',
      value: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-a1b2c3d4e5f6'},
      } as Partial<Image>,
    },
    {name: 'no value', value: undefined},
  ])('keeps the stored crop for $name', ({value}) => {
    expect(getInitialToolCrop(value, widescreen)).toBeUndefined()
  })

  test('keeps a stored crop when the source size is unknown', () => {
    const crop = cropOf(0.1, 0.2, 0.3, 0.4)
    const value = imageValue('1200x1800', crop, 'svg')
    expect(getInitialToolCrop(value, widescreen)).toBe(crop)
  })

  test('crops a source outside a range to the nearest end of it', () => {
    const range = resolveAspectRatio({min: 4 / 3, max: 16 / 9})
    const portrait = imageValue('1000x1000')
    const wide = imageValue('3000x1000')
    const portraitSize = getCroppedImageDimensions(
      withCrop(portrait, getInitialToolCrop(portrait, range)),
    )
    const wideSize = getCroppedImageDimensions(withCrop(wide, getInitialToolCrop(wide, range)))
    expect(portraitSize).toEqual({width: 1000, height: 750})
    expect(wideSize).toEqual({width: 1778, height: 1000})
  })

  test('keeps a source whose ratio is inside a range', () => {
    const range = resolveAspectRatio({min: 4 / 3, max: 16 / 9})
    expect(getInitialToolCrop(imageValue('1500x1000'), range)).toBeUndefined()
  })

  test('crops to the listed ratio nearest the source', () => {
    const list = resolveAspectRatio([1, 4 / 3, 16 / 9])
    const value = imageValue('1500x1000')
    const dimensions = getCroppedImageDimensions(withCrop(value, getInitialToolCrop(value, list)))
    expect(dimensions).toEqual({width: 1333, height: 1000})
  })

  test('replaces a stored crop that is not one of the listed ratios', () => {
    const list = resolveAspectRatio([1, 16 / 9])
    const value = imageValue('1200x1800', cropOf(0, 0, 0.5, 0))
    const dimensions = getCroppedImageDimensions(withCrop(value, getInitialToolCrop(value, list)))
    expect(dimensions && dimensionsMatchConstraint(dimensions, list)).toBe(true)
  })

  test.each([
    {size: '1200x1800', ratio: 16 / 9, minimum: {width: 800, height: 450}},
    {size: '1200x1800', ratio: 1, minimum: {width: 1200, height: 1200}},
    {size: '4000x3000', ratio: 16 / 9, minimum: {width: 4000, height: 2250}},
    {size: '3000x1000', ratio: 4 / 3, minimum: {width: 1333, height: 1000}},
    {size: '1000x1000', ratio: 2.35, minimum: {width: 1000, height: 425}},
  ])(
    'meets minDimensions $minimum.width x $minimum.height at the largest $ratio crop of $size',
    ({size, ratio, minimum}) => {
      const constraint = resolveAspectRatio(ratio)
      const value = imageValue(size)
      const dimensions = getCroppedImageDimensions(
        withCrop(value, getInitialToolCrop(value, constraint)),
      )
      expect(dimensions && dimensionsAtLeast(dimensions, minimum)).toBe(true)
    },
  )
})
