import {type ImageOptions, type SanityDocument} from '@sanity/types'
import {resolveAspectRatio} from '@sanity/util/image'
import {getFallbackLocaleSource, validateDocumentInternal} from '@sanity/validation/_internal'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../../schema/createSchema'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '../constants'
import {type Crop, type CropConstraints, type Rect, type Size, type ToolHandleType} from '../types'
import {handleCropHandleResize} from '../utils'

const ASSET_HASH = 'a75b03fdd5b5fa36947bf2b776a542e0c940f682'

const FIELD_OPTIONS: Record<string, ImageOptions> = {
  fixedAspectRatioImage: {
    hotspot: true,
    aspectRatio: 16 / 9,
    minDimensions: {width: 800, height: 450},
  },
  aspectRatioRangeImage: {
    hotspot: true,
    aspectRatio: {min: 4 / 3, max: 16 / 9},
    recommendedDimensions: {width: 1600, height: 900},
  },
  snapAspectRatioImage: {hotspot: true, aspectRatio: [1, 4 / 3, 16 / 9]},
  squareCropOnlyImage: {aspectRatio: 1, minDimensions: {width: 600, height: 600}},
}

const FIELD_NAMES = Object.keys(FIELD_OPTIONS)

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'imagesTest',
      type: 'document',
      fields: FIELD_NAMES.map((name) => ({name, type: 'image', options: FIELD_OPTIONS[name]})),
    },
  ],
})

const SOURCES: Size[] = [
  {width: 1200, height: 1800},
  {width: 4000, height: 6000},
  {width: 3000, height: 2000},
  {width: 4032, height: 3024},
  {width: 1000, height: 1000},
  {width: 1201, height: 1799},
]

const HANDLES: ToolHandleType[] = [
  'crop-top',
  'crop-right',
  'crop-bottom',
  'crop-left',
  'crop-topLeft',
  'crop-topRight',
  'crop-bottomLeft',
  'crop-bottomRight',
]

const SCREEN_DELTAS = [-157, -61, -23, -7, -1, 1, 3, 19, 77]

const MODIFIERS = [
  {lockRatio: false, fromCenter: false},
  {lockRatio: true, fromCenter: false},
  {lockRatio: false, fromCenter: true},
]

function displayRect(source: Size): Rect {
  const scale = Math.min(640 / source.width, 480 / source.height)
  return {left: 12, top: 12, width: source.width * scale, height: source.height * scale}
}

function assetRef(source: Size): string {
  return `image-${ASSET_HASH}-${source.width}x${source.height}-jpg`
}

function constraintsFor(options: ImageOptions): CropConstraints {
  return {
    aspectRatio:
      options.aspectRatio === undefined ? undefined : resolveAspectRatio(options.aspectRatio),
    minDimensions: options.minDimensions,
  }
}

function imageValue(source: Size, crop: Crop | undefined) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetRef(source)},
    ...(crop && {crop: {_type: 'sanity.imageCrop', ...crop}}),
  }
}

async function errorsFor(fieldName: string, source: Size, crop: Crop | undefined) {
  const document: SanityDocument = {
    _id: 'imagesTest',
    _type: 'imagesTest',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: 'rev',
    [fieldName]: imageValue(source, crop),
  }
  const markers = await validateDocumentInternal({
    document,
    schema,
    environment: 'studio',
    validateReferenceTypes: false,
    i18n: getFallbackLocaleSource(),
    getClient: () => {
      throw new Error('crop validation needs no client')
    },
    getDocumentExists: () => Promise.resolve(true),
  })
  return markers.filter((marker) => marker.level === 'error')
}

function sourceHoldsMinimum(options: ImageOptions, source: Size): boolean {
  const minimum = options.minDimensions
  return minimum === undefined || (minimum.width <= source.width && minimum.height <= source.height)
}

interface DragCase {
  fieldName: string
  source: Size
  handle: ToolHandleType
  screenDelta: number
  modifiers: (typeof MODIFIERS)[number]
}

const DRAG_CASES: DragCase[] = FIELD_NAMES.flatMap((fieldName) =>
  SOURCES.filter((source) => sourceHoldsMinimum(FIELD_OPTIONS[fieldName], source)).flatMap(
    (source) =>
      HANDLES.flatMap((handle) =>
        SCREEN_DELTAS.flatMap((screenDelta) =>
          MODIFIERS.map((modifiers) => ({fieldName, source, handle, screenDelta, modifiers})),
        ),
      ),
  ),
)

function dragFrom(initialCrop: Crop, dragCase: DragCase): Crop {
  const {fieldName, source, handle, screenDelta, modifiers} = dragCase
  const innerRect = displayRect(source)
  const initialCursor = {x: 300, y: 200}
  return handleCropHandleResize({
    initialCrop,
    initialHotspot: DEFAULT_HOTSPOT,
    initialCursor,
    pointerPos: {x: initialCursor.x + screenDelta, y: initialCursor.y + screenDelta},
    innerRect,
    activeHandle: handle,
    sourceSize: source,
    constraints: constraintsFor(FIELD_OPTIONS[fieldName]),
    modifiers,
  }).crop
}

function describeCase({fieldName, source, handle, screenDelta, modifiers}: DragCase): string {
  return `${fieldName} ${source.width}x${source.height} ${handle} ${screenDelta}px ${JSON.stringify(modifiers)}`
}

describe('crops written by the constrained crop tool pass the inferred validation', () => {
  test('an uncropped portrait image fails every constrained field it does not match', async () => {
    const portrait = {width: 1200, height: 1800}
    const failing = await Promise.all(
      FIELD_NAMES.map(
        async (fieldName) => (await errorsFor(fieldName, portrait, undefined)).length,
      ),
    )
    expect(failing.every((count) => count > 0)).toBe(true)
  })

  test('one handle drag from the uncropped image clears the error for every field', async () => {
    const results = await Promise.all(
      DRAG_CASES.map(async (dragCase) => {
        const crop = dragFrom(DEFAULT_CROP, dragCase)
        const errors = await errorsFor(dragCase.fieldName, dragCase.source, crop)
        return {label: describeCase(dragCase), crop, errors: errors.map((error) => error.message)}
      }),
    )
    expect(results.filter((result) => result.errors.length > 0)).toEqual([])
  })

  test('a second drag from a constrained crop keeps the error cleared', async () => {
    const results = await Promise.all(
      DRAG_CASES.map(async (dragCase) => {
        const firstCrop = dragFrom(DEFAULT_CROP, {...dragCase, handle: 'crop-bottomRight'})
        const crop = dragFrom(firstCrop, dragCase)
        const errors = await errorsFor(dragCase.fieldName, dragCase.source, crop)
        return {label: describeCase(dragCase), crop, errors: errors.map((error) => error.message)}
      }),
    )
    expect(results.filter((result) => result.errors.length > 0)).toEqual([])
  })
})
