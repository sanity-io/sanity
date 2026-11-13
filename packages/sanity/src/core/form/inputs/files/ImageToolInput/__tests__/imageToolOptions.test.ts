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

import {prepareI18n} from '../../../../../i18n/i18nConfig'
import {validationLocaleNamespace} from '../../../../../i18n/localeNamespaces'
import {type LocaleResourceRecord} from '../../../../../i18n/types'
import {createSchema} from '../../../../../schema/createSchema'
import {
  getCropAspectRatioMessageOptions,
  getCropSizeStatus,
  getHotspotPreviews,
  getImageToolPath,
  getInitialToolCrop,
  hasCropSizeReadout,
} from '../imageToolOptions'

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

  test('starts from a listed ratio that holds minDimensions when the nearest one does not', () => {
    const list = resolveAspectRatio([3 / 4, 16 / 9])
    const value = imageValue('1300x1500')
    const crop = getInitialToolCrop(value, list, {width: 1200, height: 675})
    expect(getCroppedImageDimensions(withCrop(value, crop))).toEqual({width: 1300, height: 731})
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

describe('hotspot previews', () => {
  test('keeps the common ratios without an aspect ratio', () => {
    expect(getHotspotPreviews({hotspot: true}).map(({title}) => title)).toEqual([
      '3:4',
      'Square',
      '16:9',
      'Panorama',
    ])
  })

  test.each([
    {name: 'fixed ratio', aspectRatio: 16 / 9, titles: ['16:9']},
    {name: 'range', aspectRatio: {min: 4 / 3, max: 16 / 9}, titles: ['4:3', '16:9']},
    {name: 'list', aspectRatio: [16 / 9, 1, 4 / 3], titles: ['1:1', '4:3', '16:9']},
  ])('shows one preview per allowed ratio of a $name', ({aspectRatio, titles}) => {
    const previews = getHotspotPreviews({hotspot: true, aspectRatio})
    expect(previews.map(({title}) => title)).toEqual(titles)
    expect(previews.map((preview) => preview.aspectRatio)).toEqual(
      titles.map((title) => {
        const [width, height] = title.split(':').map(Number)
        return expect.closeTo(width / height)
      }),
    )
  })

  test('shows one preview for a range with equal bounds', () => {
    expect(getHotspotPreviews({aspectRatio: {min: 1, max: 1}})).toEqual([
      {title: '1:1', aspectRatio: 1},
    ])
  })

  test.each([
    {name: 'listed previews', previews: [{title: 'Banner', aspectRatio: 3}]},
    {name: 'no previews', previews: []},
  ])('keeps $name set on the field over its aspect ratio', ({previews}) => {
    expect(getHotspotPreviews({hotspot: {previews}, aspectRatio: 1})).toBe(previews)
  })

  test('falls back to the aspect ratio when an untyped schema sets the hotspot to null', () => {
    const hotspot: unknown = null
    expect(getHotspotPreviews({hotspot, aspectRatio: 1} as ImageOptions)).toEqual([
      {title: '1:1', aspectRatio: 1},
    ])
  })
})

describe('crop size readout', () => {
  test.each([
    {name: 'plain', options: undefined, shown: false},
    {name: 'hotspot', options: {hotspot: true}, shown: false},
    {name: 'aspectRatio', options: {aspectRatio: 1}, shown: true},
    {name: 'minDimensions', options: {minDimensions: {width: 10, height: 10}}, shown: true},
    {
      name: 'recommendedDimensions',
      options: {hotspot: true, recommendedDimensions: {width: 10, height: 10}},
      shown: true,
    },
  ])('is shown for a $name image: $shown', ({options, shown}) => {
    expect(hasCropSizeReadout(options)).toBe(shown)
  })

  const SIZES: ImageOptions = {
    minDimensions: {width: 800, height: 450},
    recommendedDimensions: {width: 1600, height: 900},
  }

  test.each([
    {name: 'the minimum', dimensions: {width: 799, height: 900}, tone: 'critical'},
    {name: 'the recommended size', dimensions: {width: 1600, height: 899}, tone: 'caution'},
    {name: 'neither', dimensions: {width: 1600, height: 900}, tone: undefined},
  ])('flags a crop below $name', ({dimensions, tone}) => {
    expect(getCropSizeStatus(dimensions, SIZES).tone).toBe(tone)
  })

  test('names the threshold the crop is below', () => {
    expect(getCropSizeStatus({width: 100, height: 100}, SIZES).threshold).toEqual(
      SIZES.minDimensions,
    )
    expect(getCropSizeStatus({width: 1000, height: 500}, SIZES).threshold).toEqual(
      SIZES.recommendedDimensions,
    )
  })

  test('flags nothing without a size option', () => {
    expect(getCropSizeStatus({width: 1, height: 1}, {aspectRatio: 1}).tone).toBeUndefined()
  })
})

describe('getCropAspectRatioMessageOptions', () => {
  const MESSAGE_KEY = 'validation:object.image-aspect-ratio-mismatch'

  async function createValidationT(overrides: LocaleResourceRecord, locale = 'en-US') {
    const {i18next} = prepareI18n({
      projectId: 'test',
      dataset: 'test',
      name: 'test',
      i18n: {
        bundles: [{locale, namespace: validationLocaleNamespace, resources: overrides}],
        locales: [{id: locale, title: locale, weekInfo: {firstDay: 1, weekend: [6, 7]}}],
      },
    })
    await i18next.init()
    await i18next.changeLanguage(locale)
    await i18next.loadNamespaces(validationLocaleNamespace)
    return i18next.t
  }

  test.each([
    {name: 'a fixed ratio', aspectRatio: 16 / 9, expected: '16:9'},
    {name: 'a range', aspectRatio: {min: 4 / 3, max: 16 / 9}, expected: 'between 4:3 and 16:9'},
    {name: 'a list of two', aspectRatio: [1, 16 / 9], expected: '1:1 or 16:9'},
    {name: 'a list', aspectRatio: [1, 4 / 3, 16 / 9], expected: '1:1, 4:3, or 16:9'},
  ])('words $name the way the validation message does', async ({aspectRatio, expected}) => {
    const t = await createValidationT({})
    expect(t(MESSAGE_KEY, getCropAspectRatioMessageOptions({aspectRatio}))).toBe(
      `Cropped image aspect ratio must be ${expected}`,
    )
  })

  test('leaves the words around a range and a list to the locale', async () => {
    const t = await createValidationT(
      {
        'object.image-aspect-ratio-mismatch_list':
          'Seitenverhältnis {{ratios, list(type: disjunction)}}',
        'object.image-aspect-ratio-mismatch_range': 'Seitenverhältnis zwischen {{min}} und {{max}}',
      },
      'de-DE',
    )
    const range = getCropAspectRatioMessageOptions({aspectRatio: {min: 4 / 3, max: 16 / 9}})
    const list = getCropAspectRatioMessageOptions({aspectRatio: [1, 4 / 3, 16 / 9]})
    const longList = getCropAspectRatioMessageOptions({aspectRatio: [1, 4 / 3, 16 / 9, 2]})
    expect(t(MESSAGE_KEY, range)).toBe('Seitenverhältnis zwischen 4:3 und 16:9')
    expect(t(MESSAGE_KEY, list)).toBe('Seitenverhältnis 1:1, 4:3 oder 16:9')
    expect(t(MESSAGE_KEY, longList)).toBe('Seitenverhältnis 1:1, 4:3, 16:9 oder 2:1')
    expect([list, longList].map((options) => t(MESSAGE_KEY, options).includes(' or '))).toEqual([
      false,
      false,
    ])
  })

  test('states nothing without an aspect ratio', () => {
    expect(
      getCropAspectRatioMessageOptions({minDimensions: {width: 10, height: 10}}),
    ).toBeUndefined()
    expect(getCropAspectRatioMessageOptions(undefined)).toBeUndefined()
  })
})
