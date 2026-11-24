import {
  type ImageAspectRatio,
  type ImageCrop,
  type ImageHotspot,
  type ImageOptions,
  type ObjectSchemaType,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../schema/createSchema'
import {applyAll} from '../../../../patch/applyPatch'
import {set, unset} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {withDefaultCrop} from '../utils/defaultCrop'

const WIDE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-2000x1000-jpg'
const SQUARE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-1000x1000-jpg'

function setAsset(ref: string) {
  return set({_type: 'reference', _ref: ref}, ['asset'])
}

describe('withDefaultCrop', () => {
  test('writes the default crop right after the patch that sets an off-ratio asset', () => {
    const {patches} = withDefaultCrop(
      [unset(['crop']), setAsset(WIDE_REF), set(100, ['_upload', 'progress'])],
      {aspectRatio: 1},
    )
    expect(patches.map(({path}) => path.join('.'))).toEqual([
      'crop',
      'asset',
      'crop',
      '_upload.progress',
    ])
    expect(patches[2]).toMatchObject({
      type: 'set',
      value: {_type: 'sanity.imageCrop', left: 0.25, right: 0.25, top: 0, bottom: 0},
    })
  })

  test('accepts a single patch and a patch event', () => {
    expect(withDefaultCrop(setAsset(WIDE_REF), {aspectRatio: 1}).patches).toHaveLength(2)
    expect(
      withDefaultCrop(PatchEvent.from(setAsset(WIDE_REF)), {aspectRatio: 1}).patches,
    ).toHaveLength(2)
  })

  test('keeps the crop when the field already holds the asset', () => {
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], {aspectRatio: 1}, undefined, WIDE_REF)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual(['set asset'])
  })

  test('writes the default crop when the field holds a different asset', () => {
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], {aspectRatio: 1}, undefined, SQUARE_REF)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'set crop',
    ])
  })

  test('clears the crop when the asset already fits', () => {
    const {patches} = withDefaultCrop([setAsset(SQUARE_REF)], {aspectRatio: 1})
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'unset crop',
    ])
  })

  test('clears the previous asset crop on a field with only minDimensions', () => {
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], {
      minDimensions: {width: 600, height: 600},
    })
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'unset crop',
    ])
  })

  test('writes only the asset on a field with no crop options', () => {
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], undefined)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual(['set asset'])
  })

  test.each([
    {name: 'an empty aspectRatio list', options: {aspectRatio: []}},
    {name: 'a NaN aspectRatio', options: {aspectRatio: Number.NaN}},
    {name: 'a flipped aspectRatio range', options: {aspectRatio: {min: 2, max: 1}}},
    {name: 'a string aspectRatio', options: {aspectRatio: '16/9'}},
  ])('writes no crop for $name a field sets on a named image type', ({options}) => {
    const schema = createSchema({
      name: 'default',
      types: [
        {name: 'namedImage', type: 'image'},
        {name: 'post', type: 'document', fields: [{name: 'photo', type: 'namedImage', options}]},
      ],
    })
    const photo = (schema.get('post') as ObjectSchemaType).fields.find(
      (field) => field.name === 'photo',
    )
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], photo?.type.options as ImageOptions)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual(['set asset'])
  })

  test('moves the stored hotspot inside the crop it writes', () => {
    const hotspot = {
      _type: 'sanity.imageHotspot' as const,
      x: 0.15,
      y: 0.5,
      width: 0.1,
      height: 0.1,
    }
    const {patches} = withDefaultCrop([setAsset(WIDE_REF)], {aspectRatio: 1}, hotspot)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'set crop',
      'set hotspot',
    ])
    expect(patches[2]).toMatchObject({
      value: {_type: 'sanity.imageHotspot', x: 0.3, y: 0.5, width: 0.1, height: 0.1},
    })
  })

  const HOTSPOT_SOURCES = ['2000x1000', '1200x1800', '1x10000', '1001x1000']
  const HOTSPOT_RATIOS: ImageAspectRatio[] = [1, 16 / 9, 9 / 16, [1, 16 / 9], {min: 0.5, max: 2}]
  const HOTSPOTS = [
    {x: 0.5, y: 0.5, width: 1, height: 1},
    {x: 0.02, y: 0.98, width: 0.04, height: 0.04},
    {x: 0.7, y: 0.05, width: 0.6, height: 0.1},
  ]

  test.each(
    HOTSPOT_SOURCES.flatMap((size) => HOTSPOT_RATIOS.map((aspectRatio) => ({size, aspectRatio}))),
  )(
    'keeps every stored hotspot inside the crop it writes on $size at $aspectRatio',
    ({size, aspectRatio}) => {
      const ref = `image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-${size}-jpg`
      const outside = HOTSPOTS.filter((hotspot) => {
        const {patches} = withDefaultCrop([setAsset(ref)], {aspectRatio}, hotspot)
        const stored: {crop?: ImageCrop; hotspot: ImageHotspot} = applyAll({hotspot}, patches)
        const written = stored.hotspot
        const bounds = stored.crop ?? {top: 0, bottom: 0, left: 0, right: 0}
        return (
          written.x - written.width / 2 < bounds.left - 1e-9 ||
          written.x + written.width / 2 > 1 - bounds.right + 1e-9 ||
          written.y - written.height / 2 < bounds.top - 1e-9 ||
          written.y + written.height / 2 > 1 - bounds.bottom + 1e-9
        )
      })
      expect(outside).toEqual([])
    },
  )

  test('leaves the hotspot alone when the asset already fits', () => {
    const hotspot = {x: 0.15, y: 0.5, width: 0.1, height: 0.1}
    const {patches} = withDefaultCrop([setAsset(SQUARE_REF)], {aspectRatio: 1}, hotspot)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'unset crop',
    ])
  })

  test('clears the crop for an asset reference without encoded dimensions', () => {
    const {patches} = withDefaultCrop([setAsset('image-legacy-asset-without-size')], {
      aspectRatio: 1,
    })
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'unset crop',
    ])
  })

  test('does not bring back a hotspot the same change clears', () => {
    const hotspot = {x: 0.15, y: 0.5, width: 0.1, height: 0.1}
    const {patches} = withDefaultCrop(
      [unset(['hotspot']), setAsset(WIDE_REF)],
      {aspectRatio: 1},
      hotspot,
    )
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'unset hotspot',
      'set asset',
      'set crop',
    ])
  })

  test('leaves patches that do not set the asset alone', () => {
    const patches = [
      set({_type: 'reference', _ref: WIDE_REF}, ['media']),
      set(WIDE_REF, ['asset', '_ref']),
      unset(['asset']),
    ]
    expect(withDefaultCrop(patches, {aspectRatio: 1}).patches).toEqual(patches)
  })
})
