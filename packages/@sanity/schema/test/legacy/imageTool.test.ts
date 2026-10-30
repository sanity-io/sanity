import {type ImageOptions} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'
import {isHotspotEnabled, isImageToolEnabled} from '../../src/legacy/types/image/imageTool'
import {builtinTypes} from '../../src/sanity/builtinTypes'

function getHiddenToolFields(options: ImageOptions | undefined) {
  const schema = Schema.compile({
    name: 'images',
    types: [{name: 'testImage', type: 'image', options}, ...builtinTypes],
  })
  const fields: {name: string; type: {hidden?: boolean}}[] = schema.get('testImage').fields
  return Object.fromEntries(
    fields
      .filter((field) => field.name === 'hotspot' || field.name === 'crop')
      .map((field) => [field.name, field.type.hidden === true]),
  )
}

/** Untyped schemas can set any value, and the field still has to follow it. */
function withUntypedHotspot(hotspot: unknown, options: ImageOptions = {}): ImageOptions {
  return {...options, hotspot} as ImageOptions
}

const SIZE = {width: 10, height: 10}

describe('image tool options', () => {
  test.each([
    {name: 'no options', options: undefined, hotspot: false, cropTool: false},
    {name: 'no hotspot option', options: {}, hotspot: false, cropTool: false},
    {name: 'hotspot: undefined', options: {hotspot: undefined}, hotspot: false, cropTool: false},
    {name: 'hotspot: null', options: withUntypedHotspot(null), hotspot: false, cropTool: false},
    {name: 'hotspot: false', options: {hotspot: false}, hotspot: false, cropTool: false},
    {name: 'hotspot: true', options: {hotspot: true}, hotspot: true, cropTool: true},
    {name: 'hotspot: {}', options: {hotspot: {}}, hotspot: true, cropTool: true},
    {name: 'hotspot previews', options: {hotspot: {previews: []}}, hotspot: true, cropTool: true},
    {name: 'hotspot: 1', options: withUntypedHotspot(1), hotspot: true, cropTool: true},
    {name: 'aspectRatio', options: {aspectRatio: 1}, hotspot: false, cropTool: true},
    {name: 'minDimensions', options: {minDimensions: SIZE}, hotspot: false, cropTool: true},
    {
      name: 'hotspot: false with aspectRatio',
      options: {hotspot: false, aspectRatio: 1},
      hotspot: false,
      cropTool: true,
    },
    {
      name: 'hotspot: null with minDimensions',
      options: withUntypedHotspot(null, {minDimensions: SIZE}),
      hotspot: false,
      cropTool: true,
    },
    {
      name: 'hotspot: true with aspectRatio',
      options: {hotspot: true, aspectRatio: 1},
      hotspot: true,
      cropTool: true,
    },
    {
      name: 'recommendedDimensions alone',
      options: {recommendedDimensions: SIZE},
      hotspot: false,
      cropTool: false,
    },
  ])('resolves an image with $name', ({options, hotspot, cropTool}) => {
    expect(isHotspotEnabled(options)).toBe(hotspot)
    expect(isImageToolEnabled(options)).toBe(cropTool)
    expect(getHiddenToolFields(options)).toEqual({
      hotspot: hotspot === false,
      crop: cropTool === false,
    })
  })
})
