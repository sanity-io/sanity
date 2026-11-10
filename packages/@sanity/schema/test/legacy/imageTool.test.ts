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

describe('image tool fields of a field that uses a named image type', () => {
  const schema = Schema.compile({
    name: 'images',
    types: [
      {name: 'plainImage', type: 'image'},
      {name: 'hotspotImage', type: 'image', options: {hotspot: true}},
      {name: 'ratioImage', type: 'image', options: {aspectRatio: 16 / 9}},
      {
        name: 'imagesDocument',
        type: 'document',
        fields: [
          {name: 'inlineRatio', type: 'image', options: {aspectRatio: 16 / 9}},
          {name: 'inlineMinimum', type: 'image', options: {minDimensions: SIZE}},
          {name: 'namedRatio', type: 'plainImage', options: {aspectRatio: 16 / 9}},
          {name: 'namedMinimum', type: 'plainImage', options: {minDimensions: SIZE}},
          {name: 'namedHotspot', type: 'plainImage', options: {hotspot: true}},
          {name: 'namedHotspotReplaced', type: 'hotspotImage', options: {aspectRatio: 1}},
          {name: 'namedRatioInherited', type: 'ratioImage', title: 'Inherits the options'},
          {name: 'namedPlain', type: 'plainImage'},
        ],
      },
      ...builtinTypes,
    ],
  })

  interface CompiledField {
    name: string
    type: {
      hidden?: boolean
      fields: CompiledField[]
      fieldsets: {single?: boolean; field?: CompiledField}[]
    }
  }

  function getImageField(name: string): CompiledField {
    const fields: CompiledField[] = schema.get('imagesDocument').fields
    const field = fields.find((candidate) => candidate.name === name)
    if (field === undefined) throw new Error(`No field named ${name}`)
    return field
  }

  function hiddenToolFields(fields: CompiledField[]) {
    return Object.fromEntries(
      fields
        .filter((field) => field.name === 'hotspot' || field.name === 'crop')
        .map((field) => [field.name, field.type.hidden === true]),
    )
  }

  test.each([
    {name: 'inlineRatio', hotspot: true, crop: false},
    {name: 'inlineMinimum', hotspot: true, crop: false},
    {name: 'namedRatio', hotspot: true, crop: false},
    {name: 'namedMinimum', hotspot: true, crop: false},
    {name: 'namedHotspot', hotspot: false, crop: false},
    {name: 'namedHotspotReplaced', hotspot: true, crop: false},
    {name: 'namedRatioInherited', hotspot: true, crop: false},
    {name: 'namedPlain', hotspot: true, crop: true},
  ])('hides the hotspot ($hotspot) and crop ($crop) fields of $name', ({name, hotspot, crop}) => {
    const {type} = getImageField(name)
    const fieldsetFields = type.fieldsets.flatMap((fieldset) =>
      fieldset.single && fieldset.field ? [fieldset.field] : [],
    )
    expect(hiddenToolFields(type.fields)).toEqual({hotspot, crop})
    expect(hiddenToolFields(fieldsetFields)).toEqual({hotspot, crop})
  })
})
