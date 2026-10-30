import {isHotspotEnabled, isImageToolEnabled} from '@sanity/schema/_internal'
import {defineType, type ImageOptions, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../schema/createSchema'
import {getImageToolPath} from '../imageToolOptions'

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
