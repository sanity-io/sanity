import {type ImageOptions, type SanityDocument} from '@sanity/types'
import {
  dimensionsAtLeast,
  dimensionsMatchConstraint,
  getCroppedImageDimensions,
  getDefaultImageCrop,
  pixelRectToCrop,
  resolveAspectRatio,
} from '@sanity/util/image'
import {getFallbackLocaleSource, validateDocumentInternal} from '@sanity/validation/_internal'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../../../schema/createSchema'
import {getInitialToolCrop} from '../../imageToolOptions'
import {DEFAULT_CROP, DEFAULT_HOTSPOT, KEYBOARD_RESIZE_STEP} from '../constants'
import {
  type Crop,
  type CropConstraints,
  type Hotspot,
  type Rect,
  type Size,
  type ToolHandleType,
} from '../types'
import {constrainHotspotToCrop, handleCropHandleResize, handleCropMove} from '../utils'

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
  snapAspectRatioMinimumImage: {
    hotspot: true,
    aspectRatio: [1, 16 / 9],
    minDimensions: {width: 800, height: 450},
  },
  snapPortraitLandscapeMinimumImage: {
    aspectRatio: [3 / 4, 16 / 9],
    minDimensions: {width: 1200, height: 675},
  },
  squareCropOnlyImage: {aspectRatio: 1, minDimensions: {width: 600, height: 600}},
  narrowMinimumImage: {aspectRatio: 16 / 9, minDimensions: {width: 1200, height: 800}},
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
  {width: 1300, height: 1500},
  {width: 1415, height: 800},
  {width: 1415, height: 810},
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

const SWEEP_TIMEOUT = 30_000

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

function imageValue(source: Size, crop?: Crop) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetRef(source)},
    ...(crop && {crop: {_type: 'sanity.imageCrop' as const, ...crop}}),
  }
}

function validate(document: SanityDocument, documentSchema = schema) {
  return validateDocumentInternal({
    document,
    schema: documentSchema,
    environment: 'studio',
    validateReferenceTypes: false,
    i18n: getFallbackLocaleSource(),
    getClient: () => {
      throw new Error('crop validation needs no client')
    },
    getDocumentExists: () => Promise.resolve(true),
  })
}

async function errorsFor(fieldName: string, source: Size, crop: Crop | undefined) {
  const markers = await validate({
    _id: 'imagesTest',
    _type: 'imagesTest',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: 'rev',
    [fieldName]: imageValue(source, crop),
  })
  return markers.filter((marker) => marker.level === 'error')
}

interface DragCase {
  fieldName: string
  source: Size
  handle: ToolHandleType
  screenDelta: number
  modifiers: (typeof MODIFIERS)[number]
}

const DRAG_CASES: DragCase[] = FIELD_NAMES.flatMap((fieldName) =>
  SOURCES.filter((source) => anyCropPasses(source, FIELD_OPTIONS[fieldName])).flatMap((source) =>
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

function minimumMatchesRatio({minDimensions, aspectRatio}: ImageOptions): boolean {
  return (
    minDimensions !== undefined &&
    aspectRatio !== undefined &&
    dimensionsMatchConstraint(minDimensions, resolveAspectRatio(aspectRatio))
  )
}

function centeredMinimumCrop(source: Size, minimum: Size): Crop {
  return pixelRectToCrop(
    {
      x: (source.width - minimum.width) / 2,
      y: (source.height - minimum.height) / 2,
      width: minimum.width,
      height: minimum.height,
    },
    source,
  )
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

  test.each([
    {
      name: 'the crop tool starts from',
      getCrop: (source: Size, options: ImageOptions) =>
        getInitialToolCrop(
          imageValue(source),
          constraintsFor(options).aspectRatio,
          options.minDimensions,
        ),
    },
    {
      name: 'an upload writes',
      getCrop: (source: Size, options: ImageOptions) =>
        getDefaultImageCrop(assetRef(source), options.aspectRatio, options.minDimensions),
    },
  ])(
    'the crop $name clears the error for every field on every source some crop passes on',
    async ({getCrop}) => {
      const results = await Promise.all(
        FIELD_NAMES.flatMap((fieldName) =>
          SOURCES.filter((source) => anyCropPasses(source, FIELD_OPTIONS[fieldName])).map(
            async (source) => {
              const crop = getCrop(source, FIELD_OPTIONS[fieldName])
              const errors = await errorsFor(fieldName, source, crop)
              return {
                label: `${fieldName} ${source.width}x${source.height}`,
                crop,
                errors: errors.map((error) => error.message),
              }
            },
          ),
        ),
      )
      expect(results.filter((result) => result.errors.length > 0)).toEqual([])
    },
  )

  test(
    'one handle drag from the uncropped image clears the error for every field',
    {timeout: SWEEP_TIMEOUT},
    async () => {
      const results = await Promise.all(
        DRAG_CASES.map(async (dragCase) => {
          const crop = dragFrom(DEFAULT_CROP, dragCase)
          const errors = await errorsFor(dragCase.fieldName, dragCase.source, crop)
          return {label: describeCase(dragCase), crop, errors: errors.map((error) => error.message)}
        }),
      )
      expect(results.filter((result) => result.errors.length > 0)).toEqual([])
    },
  )

  test(
    'a second drag from a constrained crop keeps the error cleared',
    {timeout: SWEEP_TIMEOUT},
    async () => {
      const results = await Promise.all(
        DRAG_CASES.map(async (dragCase) => {
          const firstCrop = dragFrom(DEFAULT_CROP, {...dragCase, handle: 'crop-bottomRight'})
          const crop = dragFrom(firstCrop, dragCase)
          const errors = await errorsFor(dragCase.fieldName, dragCase.source, crop)
          return {label: describeCase(dragCase), crop, errors: errors.map((error) => error.message)}
        }),
      )
      expect(results.filter((result) => result.errors.length > 0)).toEqual([])
    },
  )

  test(
    'a drag from a centred crop at the minimum size keeps the error cleared',
    {timeout: SWEEP_TIMEOUT},
    async () => {
      const results = await Promise.all(
        DRAG_CASES.filter(({fieldName}) => minimumMatchesRatio(FIELD_OPTIONS[fieldName])).map(
          async (dragCase) => {
            const minimum = FIELD_OPTIONS[dragCase.fieldName].minDimensions as Size
            const crop = dragFrom(centeredMinimumCrop(dragCase.source, minimum), dragCase)
            const errors = await errorsFor(dragCase.fieldName, dragCase.source, crop)
            return {
              label: describeCase(dragCase),
              crop,
              errors: errors.map((error) => error.message),
            }
          },
        ),
      )
      expect(results.filter((result) => result.errors.length > 0)).toEqual([])
    },
  )
})

describe('a side drag on a fixed ratio crop flush with one cross side', () => {
  const fieldName = 'fixedAspectRatioImage'
  const square: Size = {width: 1200, height: 1200}
  const innerRect = displayRect(square)
  const leftFlush: Crop = {left: 0, right: 0.0284, top: 0.2833, bottom: 0.1702}
  const initialCursor = {x: 300, y: 200}

  function resizeBottom(crop: Crop, screenDelta: number): Crop {
    return handleCropHandleResize({
      initialCrop: crop,
      initialHotspot: DEFAULT_HOTSPOT,
      initialCursor,
      pointerPos: {x: initialCursor.x, y: initialCursor.y + screenDelta},
      innerRect,
      activeHandle: 'crop-bottom',
      sourceSize: square,
      constraints: constraintsFor(FIELD_OPTIONS[fieldName]),
    }).crop
  }

  test('grows into the free side and passes validation', async () => {
    const crop = resizeBottom(leftFlush, 30)
    expect(crop.left).toBeCloseTo(0)
    expect(crop.right).toBeCloseTo(0)
    expect(crop.top).toBeCloseTo(leftFlush.top)
    expect(crop.bottom).toBeCloseTo(1 - leftFlush.top - 675 / 1200)
    expect(await errorsFor(fieldName, square, crop)).toEqual([])
  })

  test('grows on every keyboard resize step until it spans the image width', async () => {
    const keyboardStep = innerRect.height * KEYBOARD_RESIZE_STEP
    const crops = Array.from({length: 8}).reduce<Crop[]>(
      (steps) => [...steps, resizeBottom(steps[steps.length - 1], keyboardStep)],
      [leftFlush],
    )
    const widths = crops.map((crop) => 1 - crop.left - crop.right)
    expect(widths.slice(1).every((width, step) => width > widths[step] - 1e-9)).toBe(true)
    expect(widths[1]).toBeGreaterThan(widths[0])
    expect(widths[widths.length - 1]).toBeCloseTo(1)

    const errors = await Promise.all(crops.map((crop) => errorsFor(fieldName, square, crop)))
    expect(errors.slice(1).flat()).toEqual([])
  })
})

describe('a 16:9 field whose minimum is narrower than 16:9, on a 1415 × 800 image', () => {
  const fieldName = 'narrowMinimumImage'
  const source: Size = {width: 1415, height: 800}
  const innerRect = displayRect(source)
  const initialCursor = {x: 300, y: 200}

  function resize(crop: Crop, activeHandle: ToolHandleType, pointerDelta: {x: number; y: number}) {
    return handleCropHandleResize({
      initialCrop: crop,
      initialHotspot: DEFAULT_HOTSPOT,
      initialCursor,
      pointerPos: {x: initialCursor.x + pointerDelta.x, y: initialCursor.y + pointerDelta.y},
      innerRect,
      activeHandle,
      sourceSize: source,
      constraints: constraintsFor(FIELD_OPTIONS[fieldName]),
    }).crop
  }

  test('passes uncropped, and an upload writes no crop', async () => {
    expect(await errorsFor(fieldName, source, undefined)).toEqual([])
    expect(
      getDefaultImageCrop(
        assetRef(source),
        FIELD_OPTIONS[fieldName].aspectRatio,
        FIELD_OPTIONS[fieldName].minDimensions,
      ),
    ).toBeUndefined()
  })

  test('passes after every handle drag, repeated', async () => {
    const crops = HANDLES.flatMap((handle) =>
      [-40, 40].map((delta) => {
        const once = resize(DEFAULT_CROP, handle, {x: delta, y: delta})
        return {label: `${handle} ${delta}px`, crop: resize(once, handle, {x: delta, y: delta})}
      }),
    )
    const results = await Promise.all(
      crops.map(async ({label, crop}) => ({
        label,
        size: getCroppedImageDimensions(imageValue(source, crop)),
        errors: (await errorsFor(fieldName, source, crop)).map((error) => error.message),
      })),
    )
    expect(results.filter((result) => result.errors.length > 0)).toEqual([])
  })

  test('passes after every Ctrl+arrow keyboard resize step', async () => {
    const step = {
      x: innerRect.width * KEYBOARD_RESIZE_STEP,
      y: innerRect.height * KEYBOARD_RESIZE_STEP,
    }
    const keys: {handle: ToolHandleType; delta: {x: number; y: number}}[] = [
      {handle: 'crop-right', delta: {x: -step.x, y: 0}},
      {handle: 'crop-bottom', delta: {x: 0, y: -step.y}},
      {handle: 'crop-right', delta: {x: step.x, y: 0}},
      {handle: 'crop-bottom', delta: {x: 0, y: step.y}},
    ]
    const crops = [...keys, ...keys].reduce<Crop[]>(
      (steps, {handle, delta}) => [...steps, resize(steps[steps.length - 1], handle, delta)],
      [DEFAULT_CROP],
    )
    const errors = await Promise.all(crops.map((crop) => errorsFor(fieldName, source, crop)))
    expect(errors.flat().map((error) => error.message)).toEqual([])
  })
})

const EDGE_SOURCES: Size[] = [
  {width: 1, height: 1},
  {width: 2, height: 1},
  {width: 1, height: 2},
  {width: 3, height: 2},
  {width: 101, height: 100},
  {width: 799, height: 450},
  {width: 800, height: 449},
  {width: 1001, height: 1000},
  {width: 1, height: 10000},
  {width: 10000, height: 1},
  {width: 20000, height: 20000},
]

/** Whether any whole-pixel crop of `source` passes the field's ratio and minimum size. */
function anyCropPasses(source: Size, options: ImageOptions): boolean {
  const constraint = resolveAspectRatio(options.aspectRatio ?? 1)
  const minimum = options.minDimensions ?? {width: 1, height: 1}
  const intervals = constraint.snapRatios?.map((ratio) => ({min: ratio, max: ratio})) ?? [
    constraint.range,
  ]
  const widths = Array.from(
    {length: Math.max(0, source.width - minimum.width + 1)},
    (_unused, offset) => minimum.width + offset,
  )
  return widths.some((width) =>
    intervals.some(({min, max}) =>
      [
        Math.floor(width / max),
        Math.ceil(width / max),
        Math.floor(width / min),
        Math.ceil(width / min),
        minimum.height,
        source.height,
      ].some((height) => {
        const size = {width, height}
        return (
          height >= 1 &&
          height <= source.height &&
          dimensionsAtLeast(size, minimum) &&
          dimensionsMatchConstraint(size, constraint)
        )
      }),
    ),
  )
}

const PRODUCERS = [
  {
    name: 'the crop tool starts from',
    getCrop: (source: Size, options: ImageOptions) =>
      getInitialToolCrop(
        imageValue(source),
        constraintsFor(options).aspectRatio,
        options.minDimensions,
      ),
  },
  {
    name: 'an upload writes',
    getCrop: (source: Size, options: ImageOptions) =>
      getDefaultImageCrop(assetRef(source), options.aspectRatio, options.minDimensions),
  },
]

describe('crops on tiny, extreme and borderline sources agree with the inferred validation', () => {
  const CASES = FIELD_NAMES.flatMap((fieldName) =>
    EDGE_SOURCES.map((source) => ({
      fieldName,
      source,
      passable: anyCropPasses(source, FIELD_OPTIONS[fieldName]),
    })),
  )

  test.each(PRODUCERS)('the crop $name passes wherever some crop can', async ({getCrop}) => {
    const results = await Promise.all(
      CASES.filter(({passable}) => passable).map(async ({fieldName, source}) => {
        const crop = getCrop(source, FIELD_OPTIONS[fieldName])
        const errors = await errorsFor(fieldName, source, crop)
        return {label: `${fieldName} ${source.width}x${source.height}`, errors: errors.length}
      }),
    )
    expect(results.filter((result) => result.errors > 0)).toEqual([])
  })

  test.each(PRODUCERS)('the crop $name adds no error where no crop can pass', async ({getCrop}) => {
    const results = await Promise.all(
      CASES.filter(({passable}) => passable === false).map(async ({fieldName, source}) => {
        const crop = getCrop(source, FIELD_OPTIONS[fieldName])
        const produced = await errorsFor(fieldName, source, crop)
        const uncropped = await errorsFor(fieldName, source, undefined)
        return {
          label: `${fieldName} ${source.width}x${source.height}`,
          added: produced.length - uncropped.length,
        }
      }),
    )
    expect(results.filter((result) => result.added > 0)).toEqual([])
  })

  test('moving the crop the tool starts from keeps its measured size and the hotspot inside it', () => {
    const hotspots: Hotspot[] = [
      {x: 0.5, y: 0.5, width: 1, height: 1},
      {x: 0.02, y: 0.98, width: 0.04, height: 0.04},
      {x: 0.5, y: 0.5, width: 0.001, height: 0.001},
    ]
    const optionsList: ImageOptions[] = [...Object.values(FIELD_OPTIONS), {aspectRatio: 9 / 16}]
    const failures = optionsList.flatMap((options) =>
      [...SOURCES, ...EDGE_SOURCES].flatMap((source) => {
        const start = PRODUCERS[0].getCrop(source, options) ?? DEFAULT_CROP
        const startSize = getCroppedImageDimensions(imageValue(source, start))
        return [-300, -40, -3, 2, 50, 400].flatMap((screenDelta) =>
          hotspots.flatMap((hotspot) => {
            const {crop, hotspot: moved} = handleCropMove({
              initialCrop: start,
              initialHotspot: constrainHotspotToCrop(hotspot, start),
              initialCursor: {x: 300, y: 200},
              pointerPos: {x: 300 + screenDelta, y: 200 - screenDelta},
              innerRect: displayRect(source),
            })
            const size = getCroppedImageDimensions(imageValue(source, crop))
            const inside =
              moved.x - moved.width / 2 >= crop.left - 1e-9 &&
              moved.x + moved.width / 2 <= 1 - crop.right + 1e-9 &&
              moved.y - moved.height / 2 >= crop.top - 1e-9 &&
              moved.y + moved.height / 2 <= 1 - crop.bottom + 1e-9
            return JSON.stringify(size) === JSON.stringify(startSize) && inside
              ? []
              : [`${JSON.stringify(options)} ${source.width}x${source.height} ${screenDelta}px`]
          }),
        )
      }),
    )
    expect(failures).toEqual([])
  })
})

describe('options a field sets on a named image type', () => {
  const namedSchema = createSchema({
    name: 'default',
    types: [
      {name: 'namedImage', type: 'image', options: {hotspot: true}},
      {
        name: 'namedImageDocument',
        type: 'document',
        fields: [
          {name: 'photo', type: 'namedImage', options: {aspectRatio: 1}},
          {name: 'gallery', type: 'array', of: [{type: 'namedImage', options: {aspectRatio: 1}}]},
        ],
      },
    ],
  })

  test('are checked on the field and on an array member', async () => {
    const wide = imageValue({width: 2000, height: 1000})
    const markers = await validate(
      {
        _id: 'namedImageDocument',
        _type: 'namedImageDocument',
        _createdAt: '2026-01-01T00:00:00.000Z',
        _updatedAt: '2026-01-01T00:00:00.000Z',
        _rev: 'rev',
        photo: wide,
        gallery: [{...wide, _type: 'namedImage', _key: 'first'}],
      },
      namedSchema,
    )
    const erroredFields = markers
      .filter((marker) => marker.level === 'error')
      .map((marker) => String(marker.path[0]))
    expect(erroredFields.toSorted()).toEqual(['gallery', 'photo'])
  })
})
