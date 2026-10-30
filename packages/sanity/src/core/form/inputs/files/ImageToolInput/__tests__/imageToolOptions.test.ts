import {isHotspotEnabled, isImageToolEnabled} from '@sanity/schema/_internal'
import {defineType, type ImageOptions, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../schema/createSchema'
import {
  getCropSizeStatus,
  getHotspotPreviews,
  getImageToolPath,
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
