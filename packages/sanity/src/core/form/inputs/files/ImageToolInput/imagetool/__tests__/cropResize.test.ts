import {type ImageAspectRatio, type ImageCropDimensions} from '@sanity/types'
import {
  dimensionsAtLeast,
  dimensionsMatchConstraint,
  getCroppedImageDimensions,
  type ImagePixelRect,
  pixelRectToCrop,
  resolveAspectRatio,
} from '@sanity/util/image'
import {describe, expect, test} from 'vitest'

import {
  getMinimumCropSize,
  HANDLE_DIRECTIONS,
  resizeCropRect,
  type CropResizeOptions,
  type ResizeDirection,
} from '../cropResize'
import {type Size, type ToolHandleType} from '../types'

const EPSILON = 1e-6
const SOURCE: Size = {width: 2000, height: 2000}
const START: ImagePixelRect = {x: 500, y: 500, width: 1000, height: 1000}
const RANGE = resolveAspectRatio({min: 4 / 3, max: 16 / 9})
const SNAP = resolveAspectRatio([1, 4 / 3, 16 / 9])
const MINIMUM = getMinimumCropSize(SOURCE)

function ratioOf(rect: Size): number {
  return rect.width / rect.height
}

function expectInsideSource(rect: ImagePixelRect, source: Size) {
  expect(rect.x).toBeGreaterThanOrEqual(-EPSILON)
  expect(rect.y).toBeGreaterThanOrEqual(-EPSILON)
  expect(rect.x + rect.width).toBeLessThanOrEqual(source.width + EPSILON)
  expect(rect.y + rect.height).toBeLessThanOrEqual(source.height + EPSILON)
}

function expectRect(actual: ImagePixelRect, expected: ImagePixelRect) {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
  expect(actual.width).toBeCloseTo(expected.width)
  expect(actual.height).toBeCloseTo(expected.height)
}

const DIRECTIONS = Object.entries(HANDLE_DIRECTIONS)

const MODIFIERS: {name: string; options: Partial<CropResizeOptions>}[] = [
  {name: 'no modifier', options: {}},
  {name: 'lockRatio', options: {lockRatio: true}},
  {name: 'fromCenter', options: {fromCenter: true}},
]

const POINTERS = [
  {x: -500, y: -500},
  {x: 5000, y: 5000},
  {x: 1000, y: 1000},
  {x: 1900, y: 100},
  {x: 600, y: 1400},
]

describe('getMinimumCropSize', () => {
  test('falls back to five percent of the source on each axis', () => {
    expect(getMinimumCropSize({width: 4000, height: 1000})).toEqual({width: 200, height: 50})
  })

  test('raises the floor to the pixel minimum the source can hold', () => {
    expect(getMinimumCropSize({width: 4000, height: 1000}, {width: 800, height: 20})).toEqual({
      width: 800,
      height: 50,
    })
  })

  test.each([
    {width: 1, height: 1},
    {width: 7, height: 5},
    {width: 2, height: 1000},
  ])('never drops below a pixel on a $width × $height source', (source) => {
    const minimum = getMinimumCropSize(source)
    expect(minimum.width).toBeGreaterThanOrEqual(1)
    expect(minimum.height).toBeGreaterThanOrEqual(1)
    expect(minimum.width).toBeLessThanOrEqual(source.width)
    expect(minimum.height).toBeLessThanOrEqual(source.height)

    const shrunk = resizeCropRect(
      {x: 0, y: 0, width: source.width, height: source.height},
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 0, y: 0},
      source,
      {minimum},
    )
    expect(Math.round(shrunk.width)).toBeGreaterThanOrEqual(1)
    expect(Math.round(shrunk.height)).toBeGreaterThanOrEqual(1)
  })

  test('ignores a pixel minimum larger than the source', () => {
    expect(getMinimumCropSize({width: 400, height: 1000}, {width: 800, height: 600})).toEqual({
      width: 20,
      height: 50,
    })
  })
})

describe('resizeCropRect', () => {
  describe.each(DIRECTIONS)('dragging %s', (_handle, direction) => {
    test.each(MODIFIERS)('stays inside the image and the ratio range ($name)', ({options}) => {
      POINTERS.forEach((pointer) => {
        const next = resizeCropRect(START, direction, pointer, SOURCE, {
          aspectRatio: RANGE,
          minimum: MINIMUM,
          ...options,
        })
        expectInsideSource(next, SOURCE)
        expect(ratioOf(next)).toBeGreaterThanOrEqual(RANGE.range.min - EPSILON)
        expect(ratioOf(next)).toBeLessThanOrEqual(RANGE.range.max + EPSILON)
      })
    })

    test.each(MODIFIERS)('lands on a listed ratio ($name)', ({options}) => {
      POINTERS.forEach((pointer) => {
        const next = resizeCropRect(START, direction, pointer, SOURCE, {
          aspectRatio: SNAP,
          minimum: MINIMUM,
          ...options,
        })
        expectInsideSource(next, SOURCE)
        expect(SNAP.snapRatios?.some((ratio) => Math.abs(ratio - ratioOf(next)) < EPSILON)).toBe(
          true,
        )
      })
    })
  })

  test('keeps the opposite corner fixed when dragging a corner', () => {
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-topLeft'],
      {x: 800, y: 800},
      SOURCE,
      {
        aspectRatio: RANGE,
        minimum: MINIMUM,
      },
    )
    expect(next.x + next.width).toBeCloseTo(1500)
    expect(next.y + next.height).toBeCloseTo(1500)
  })

  test('resizes freely without a ratio, like the classic opposite-corner resize', () => {
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1800, y: 1200},
      SOURCE,
      {minimum: MINIMUM},
    )
    expectRect(next, {x: 500, y: 500, width: 1300, height: 700})
  })

  test('does not cap a ratio without a constraint', () => {
    const banner: Size = {width: 20_000, height: 100}
    const next = resizeCropRect(
      {x: 0, y: 0, width: 1000, height: 50},
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 20_000, y: 5},
      banner,
      {minimum: getMinimumCropSize(banner)},
    )
    expectRect(next, {x: 0, y: 0, width: 20_000, height: 5})
  })

  test('moves only the dragged edge on a side drag without a ratio', () => {
    const next = resizeCropRect(START, HANDLE_DIRECTIONS['crop-left'], {x: 300, y: 1000}, SOURCE, {
      minimum: MINIMUM,
    })
    expectRect(next, {x: 300, y: 500, width: 1200, height: 1000})
  })

  test('does not move the dragged edge past the opposite one', () => {
    const next = resizeCropRect(START, HANDLE_DIRECTIONS['crop-left'], {x: 1900, y: 1000}, SOURCE, {
      minimum: MINIMUM,
    })
    expect(next.x + next.width).toBeCloseTo(1500)
    expect(next.width).toBeCloseTo(MINIMUM.width)
  })

  test('takes a side drag ratio from the dragged edge, clamped to the range', () => {
    const square: ImagePixelRect = {x: 800, y: 800, width: 400, height: 400}
    const next = resizeCropRect(
      square,
      HANDLE_DIRECTIONS['crop-right'],
      {x: 1800, y: 1000},
      SOURCE,
      {
        aspectRatio: RANGE,
        minimum: MINIMUM,
      },
    )
    expect(ratioOf(next)).toBeCloseTo(16 / 9)
    expect(next.x).toBeCloseTo(800)
    expect(next.y + next.height / 2).toBeCloseTo(1000)
  })

  test('keeps a fixed ratio on every handle', () => {
    const fixed = resolveAspectRatio(16 / 9)
    DIRECTIONS.forEach(([, direction]) => {
      const next = resizeCropRect(START, direction, {x: 1900, y: 1300}, SOURCE, {
        aspectRatio: fixed,
        minimum: MINIMUM,
      })
      expect(ratioOf(next)).toBeCloseTo(16 / 9)
    })
  })

  test('brings a crop that breaks the ratio back into range on the first resize', () => {
    const tall: ImagePixelRect = {x: 500, y: 200, width: 600, height: 1200}
    const next = resizeCropRect(
      tall,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1150, y: 1450},
      SOURCE,
      {
        aspectRatio: RANGE,
        minimum: MINIMUM,
      },
    )
    expect(ratioOf(next)).toBeGreaterThanOrEqual(RANGE.range.min - EPSILON)
  })

  test('locks the current ratio on a corner with lockRatio', () => {
    const threeTwo: ImagePixelRect = {x: 400, y: 400, width: 900, height: 600}
    const next = resizeCropRect(
      threeTwo,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1800, y: 600},
      SOURCE,
      {aspectRatio: RANGE, minimum: MINIMUM, lockRatio: true},
    )
    expect(ratioOf(next)).toBeCloseTo(1.5)
    expect(next.x).toBeCloseTo(400)
    expect(next.y).toBeCloseTo(400)
  })

  test('locks the current ratio without a constraint', () => {
    const threeTwo: ImagePixelRect = {x: 400, y: 400, width: 900, height: 600}
    const next = resizeCropRect(
      threeTwo,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1600, y: 1900},
      SOURCE,
      {minimum: MINIMUM, lockRatio: true},
    )
    expect(ratioOf(next)).toBeCloseTo(1.5)
    expect(next.width).toBeCloseTo(1200)
  })

  test('keeps the centre fixed with fromCenter', () => {
    const centered: ImagePixelRect = {x: 700, y: 700, width: 600, height: 600}
    const next = resizeCropRect(
      centered,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1600, y: 1400},
      SOURCE,
      {minimum: MINIMUM, fromCenter: true},
    )
    expectRect(next, {x: 400, y: 600, width: 1200, height: 800})
  })

  test('bounds a fromCenter resize by the nearer image edge', () => {
    const nearLeft: ImagePixelRect = {x: 50, y: 900, width: 200, height: 200}
    const next = resizeCropRect(
      nearLeft,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 1900, y: 1900},
      SOURCE,
      {aspectRatio: RANGE, minimum: MINIMUM, fromCenter: true},
    )
    expectInsideSource(next, SOURCE)
    expect(next.x + next.width / 2).toBeCloseTo(150)
  })

  test('stops at the pixel minimum while keeping the ratio', () => {
    const minimum = getMinimumCropSize(SOURCE, {width: 800, height: 450})
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 600, y: 600},
      SOURCE,
      {aspectRatio: resolveAspectRatio(16 / 9), minimum},
    )
    expect(next.width).toBeCloseTo(800)
    expect(next.height).toBeCloseTo(450)
    expect(next.x).toBeCloseTo(500)
    expect(next.y).toBeCloseTo(500)
  })

  test('stops each axis at the pixel minimum without a ratio', () => {
    const minimum = getMinimumCropSize(SOURCE, {width: 800, height: 300})
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-topLeft'],
      {x: 1400, y: 1400},
      SOURCE,
      {minimum},
    )
    expectRect(next, {x: 700, y: 1200, width: 800, height: 300})
  })

  test('raises the other axis when the ratio would take it below the minimum', () => {
    const minimum = getMinimumCropSize(SOURCE, {width: 300, height: 600})
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 900, y: 900},
      SOURCE,
      {aspectRatio: resolveAspectRatio(2), minimum},
    )
    expectRect(next, {x: 500, y: 500, width: 1200, height: 600})
  })

  test('snaps a corner drag to the nearest listed ratio, anchor fixed', () => {
    const next = resizeCropRect(
      START,
      HANDLE_DIRECTIONS['crop-bottomRight'],
      {x: 2000, y: 1200},
      SOURCE,
      {
        aspectRatio: SNAP,
        minimum: MINIMUM,
      },
    )
    expect(ratioOf(next)).toBeCloseTo(16 / 9)
    expect(next.x).toBeCloseTo(500)
    expect(next.y).toBeCloseTo(500)
  })

  test('snaps a side drag to the ratio the dragged edge implies', () => {
    const fourThree: ImagePixelRect = {x: 400, y: 400, width: 1200, height: 900}
    const next = resizeCropRect(
      fourThree,
      HANDLE_DIRECTIONS['crop-right'],
      {x: 1900, y: 1000},
      SOURCE,
      {
        aspectRatio: SNAP,
        minimum: MINIMUM,
      },
    )
    expect(ratioOf(next)).toBeCloseTo(16 / 9)
  })

  test('switches listed ratios on a side drag when the other axis is pinned', () => {
    const tall: Size = {width: 1000, height: 2000}
    const snap = resolveAspectRatio([1, 4 / 5, 2 / 3])
    const fullWidth: ImagePixelRect = {x: 0, y: 500, width: 1000, height: 1000}
    const bottom: ResizeDirection = HANDLE_DIRECTIONS['crop-bottom']
    const minimum = getMinimumCropSize(tall)

    const toFourFifths = resizeCropRect(fullWidth, bottom, {x: 500, y: 1800}, tall, {
      aspectRatio: snap,
      minimum,
    })
    expect(ratioOf(toFourFifths)).toBeCloseTo(0.8)
    expect(toFourFifths.width).toBeCloseTo(1000)
    expect(toFourFifths.y).toBeCloseTo(500)

    const toTwoThirds = resizeCropRect(fullWidth, bottom, {x: 500, y: 2000}, tall, {
      aspectRatio: snap,
      minimum,
    })
    expect(ratioOf(toTwoThirds)).toBeCloseTo(2 / 3)
    expect(toTwoThirds.width).toBeCloseTo(1000)
  })

  test('skips a listed ratio whose minimum does not fit the room left by the anchor', () => {
    const square: Size = {width: 1000, height: 1000}
    const minimum = getMinimumCropSize(square, {width: 800, height: 450})
    const wide: ImagePixelRect = {x: 100, y: 403, width: 800, height: 450}
    const next = resizeCropRect(wide, HANDLE_DIRECTIONS['crop-bottom'], {x: 500, y: 1000}, square, {
      aspectRatio: resolveAspectRatio([1, 16 / 9]),
      minimum,
    })
    expect(ratioOf(next)).toBeCloseTo(16 / 9)
    expect(next.width).toBeGreaterThanOrEqual(800 - EPSILON)
    expect(next.height).toBeGreaterThanOrEqual(450 - EPSILON)
    expect(next.y).toBeCloseTo(403)
    expectInsideSource(next, square)
  })

  describe('growing a fixed ratio on a side drag when the crop is flush with one cross side', () => {
    const square: Size = {width: 1200, height: 1200}
    const options: CropResizeOptions = {
      aspectRatio: resolveAspectRatio(16 / 9),
      minimum: getMinimumCropSize(square, {width: 800, height: 450}),
    }

    test.each([
      {
        name: 'left edge flush, bottom drag',
        handle: 'crop-bottom',
        rect: {x: 0, y: 340, width: 1168, height: 657},
        pointer: {x: 584, y: 1100},
        expected: {x: 0, y: 340, width: 1200, height: 675},
      },
      {
        name: 'right edge flush, bottom drag',
        handle: 'crop-bottom',
        rect: {x: 32, y: 340, width: 1168, height: 657},
        pointer: {x: 616, y: 1100},
        expected: {x: 0, y: 340, width: 1200, height: 675},
      },
      {
        name: 'right edge flush, top drag',
        handle: 'crop-top',
        rect: {x: 32, y: 340, width: 1168, height: 657},
        pointer: {x: 616, y: 100},
        expected: {x: 0, y: 322, width: 1200, height: 675},
      },
      {
        name: 'top edge flush, right drag',
        handle: 'crop-right',
        rect: {x: 0, y: 0, width: 800, height: 450},
        pointer: {x: 1100, y: 225},
        expected: {x: 0, y: 0, width: 1100, height: 618.75},
      },
      {
        name: 'top edge flush, left drag',
        handle: 'crop-left',
        rect: {x: 400, y: 0, width: 800, height: 450},
        pointer: {x: 100, y: 225},
        expected: {x: 100, y: 0, width: 1100, height: 618.75},
      },
      {
        name: 'bottom edge flush, right drag',
        handle: 'crop-right',
        rect: {x: 0, y: 750, width: 800, height: 450},
        pointer: {x: 1100, y: 975},
        expected: {x: 0, y: 581.25, width: 1100, height: 618.75},
      },
      {
        name: 'flush on both cross sides, bottom drag',
        handle: 'crop-bottom',
        rect: {x: 0, y: 340, width: 1200, height: 675},
        pointer: {x: 600, y: 1100},
        expected: {x: 0, y: 340, width: 1200, height: 675},
      },
    ] satisfies {
      name: string
      handle: ToolHandleType
      rect: ImagePixelRect
      pointer: {x: number; y: number}
      expected: ImagePixelRect
    }[])('$name', ({handle, rect, pointer, expected}) => {
      const next = resizeCropRect(rect, HANDLE_DIRECTIONS[handle], pointer, square, options)
      expectRect(next, expected)
      expect(ratioOf(next)).toBeCloseTo(16 / 9)
      expect(next.width).toBeGreaterThanOrEqual(800 - EPSILON)
      expectInsideSource(next, square)
    })

    test('stops at the largest crop that fits, however far the pointer goes', () => {
      const leftFlush: ImagePixelRect = {x: 0, y: 340, width: 1168, height: 657}
      const next = resizeCropRect(
        leftFlush,
        HANDLE_DIRECTIONS['crop-bottom'],
        {x: 584, y: 5000},
        square,
        options,
      )
      expectRect(next, {x: 0, y: 340, width: 1200, height: 675})
    })

    test('still grows evenly about the centre when both cross sides have room', () => {
      const centered: ImagePixelRect = {x: 200, y: 340, width: 800, height: 450}
      const next = resizeCropRect(
        centered,
        HANDLE_DIRECTIONS['crop-bottom'],
        {x: 600, y: 880},
        square,
        options,
      )
      expectRect(next, {x: 120, y: 340, width: 960, height: 540})
    })
  })
})

const TINY_CONSTRAINTS = [
  {name: 'no ratio', aspectRatio: undefined},
  {name: '2.35:1', aspectRatio: resolveAspectRatio(2.35)},
  {name: '1:2.35', aspectRatio: resolveAspectRatio(1 / 2.35)},
  {name: 'a 1:3 to 3:1 range', aspectRatio: resolveAspectRatio({min: 1 / 3, max: 3})},
  {name: 'a 1:4 or 4:1 list', aspectRatio: resolveAspectRatio([1 / 4, 4])},
]

describe.each([
  {width: 1, height: 1},
  {width: 2, height: 1},
])('resizeCropRect on a $width × $height source', (source) => {
  test.each(TINY_CONSTRAINTS)(
    'keeps every handle at least a pixel on each axis with $name',
    ({aspectRatio}) => {
      const minimum = getMinimumCropSize(source)
      const start = {x: 0, y: 0, width: source.width, height: source.height}
      const pointers = [
        {x: -1, y: -1},
        {x: 0, y: 0},
        {x: source.width / 2, y: source.height / 2},
        {x: source.width, y: source.height},
        {x: source.width + 1, y: source.height + 1},
      ]
      DIRECTIONS.forEach(([handle, direction]) => {
        MODIFIERS.forEach(({options}) => {
          pointers.forEach((pointer) => {
            const resized = resizeCropRect(start, direction, pointer, source, {
              aspectRatio,
              minimum,
              ...options,
            })
            const label = `${handle} ${JSON.stringify(options)} ${JSON.stringify(pointer)}`
            expect(Math.round(resized.width), label).toBeGreaterThanOrEqual(1)
            expect(Math.round(resized.height), label).toBeGreaterThanOrEqual(1)
            expectInsideSource(resized, source)
          })
        })
      })
    },
  )
})

interface ValidatedField {
  aspectRatio: ImageAspectRatio
  minDimensions: ImageCropDimensions
}

function passesValidation(rect: ImagePixelRect, source: Size, field: ValidatedField): boolean {
  const size = getCroppedImageDimensions({
    asset: {
      _type: 'reference',
      _ref: `image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-${source.width}x${source.height}-jpg`,
    },
    crop: pixelRectToCrop(rect, source),
  })
  return (
    size !== undefined &&
    dimensionsAtLeast(size, field.minDimensions) &&
    dimensionsMatchConstraint(size, resolveAspectRatio(field.aspectRatio))
  )
}

function resizeForField(
  rect: ImagePixelRect,
  handle: ToolHandleType,
  pointer: {x: number; y: number},
  source: Size,
  field: ValidatedField,
  modifiers: Partial<CropResizeOptions> = {},
): ImagePixelRect {
  return resizeCropRect(rect, HANDLE_DIRECTIONS[handle], pointer, source, {
    aspectRatio: resolveAspectRatio(field.aspectRatio),
    minimum: getMinimumCropSize(source, field.minDimensions),
    ...modifiers,
  })
}

function draggedEdge(rect: ImagePixelRect, handle: ToolHandleType): {x: number; y: number} {
  const {dx, dy} = HANDLE_DIRECTIONS[handle]
  const edge = (start: number, length: number, direction: number) =>
    start + (length * (direction + 1)) / 2
  return {x: edge(rect.x, rect.width, dx), y: edge(rect.y, rect.height, dy)}
}

function wholeImage(source: Size): ImagePixelRect {
  return {x: 0, y: 0, width: source.width, height: source.height}
}

describe('a 16:9 field with a 1200 × 800 minimum on a 1415 × 800 image', () => {
  const field: ValidatedField = {aspectRatio: 16 / 9, minDimensions: {width: 1200, height: 800}}
  const source: Size = {width: 1415, height: 800}

  test('passes validation uncropped', () => {
    expect(passesValidation(wholeImage(source), source, field)).toBe(true)
  })

  test.each(DIRECTIONS.map(([handle]) => handle as ToolHandleType))(
    'stays 800px high and passes validation after a %s drag',
    (handle) => {
      const failures = MODIFIERS.flatMap(({name, options}) =>
        [-200, -20, 20, 200].flatMap((delta) => {
          const edge = draggedEdge(wholeImage(source), handle)
          const pointer = {x: edge.x + delta, y: edge.y + delta}
          const resized = resizeForField(
            wholeImage(source),
            handle,
            pointer,
            source,
            field,
            options,
          )
          return passesValidation(resized, source, field) && Math.round(resized.height) === 800
            ? []
            : [`${name} ${delta}px: ${resized.width} × ${resized.height}`]
        }),
      )
      expect(failures).toEqual([])
    },
  )

  test('passes validation after every keyboard resize step', () => {
    const steps: {handle: ToolHandleType; delta: Size}[] = [
      {handle: 'crop-right', delta: {width: -source.width * 0.005, height: 0}},
      {handle: 'crop-bottom', delta: {width: 0, height: -source.height * 0.005}},
      {handle: 'crop-right', delta: {width: source.width * 0.005, height: 0}},
      {handle: 'crop-bottom', delta: {width: 0, height: source.height * 0.005}},
    ]
    const rects = [...steps, ...steps].reduce<ImagePixelRect[]>(
      (previous, {handle, delta}) => {
        const rect = previous[previous.length - 1]
        const edge = draggedEdge(rect, handle)
        const pointer = {x: edge.x + delta.width, y: edge.y + delta.height}
        return [...previous, resizeForField(rect, handle, pointer, source, field)]
      },
      [wholeImage(source)],
    )
    expect(rects.filter((rect) => passesValidation(rect, source, field) === false)).toEqual([])
  })
})

describe('a drag from a crop that passes validation keeps passing', () => {
  const CASES: {field: ValidatedField; sources: Size[]}[] = [
    {
      field: {aspectRatio: 16 / 9, minDimensions: {width: 1200, height: 800}},
      sources: [
        {width: 1415, height: 800},
        {width: 1407, height: 800},
        {width: 1415, height: 803},
        {width: 1430, height: 800},
        {width: 1600, height: 900},
      ],
    },
    {
      field: {aspectRatio: 9 / 16, minDimensions: {width: 800, height: 1200}},
      sources: [
        {width: 800, height: 1415},
        {width: 803, height: 1420},
      ],
    },
    {
      field: {aspectRatio: 4 / 3, minDimensions: {width: 900, height: 760}},
      sources: [
        {width: 1010, height: 760},
        {width: 1013, height: 765},
        {width: 1333, height: 1000},
      ],
    },
    {
      field: {aspectRatio: [1, 16 / 9], minDimensions: {width: 1200, height: 800}},
      sources: [
        {width: 1415, height: 800},
        {width: 1200, height: 1200},
        {width: 1300, height: 1300},
      ],
    },
    {
      field: {aspectRatio: {min: 4 / 3, max: 16 / 9}, minDimensions: {width: 1400, height: 800}},
      sources: [
        {width: 1415, height: 800},
        {width: 1500, height: 1000},
      ],
    },
  ]
  const DELTAS = [-300, -40, -3, 3, 40, 300]
  const HANDLES = DIRECTIONS.map(([handle]) => handle as ToolHandleType)

  function dragsFrom(rect: ImagePixelRect, source: Size, field: ValidatedField) {
    return HANDLES.flatMap((handle) =>
      MODIFIERS.flatMap(({name, options}) =>
        DELTAS.map((delta) => {
          const edge = draggedEdge(rect, handle)
          const pointer = {x: edge.x + delta, y: edge.y + delta}
          return {
            label: `${handle} ${name} ${delta}px`,
            rect: resizeForField(rect, handle, pointer, source, field, options),
          }
        }),
      ),
    )
  }

  test.each(
    CASES.flatMap(({field, sources}) =>
      sources.map((source) => ({field, source, label: JSON.stringify(field.aspectRatio)})),
    ),
  )('$label on a $source.width × $source.height image', ({field, source}) => {
    expect(passesValidation(wholeImage(source), source, field)).toBe(true)
    const firstDrags = dragsFrom(wholeImage(source), source, field)
    const passingStarts = firstDrags.filter(({rect}) => passesValidation(rect, source, field))
    const secondDrags = passingStarts.flatMap((start) =>
      dragsFrom(start.rect, source, field).map((drag) => ({
        ...drag,
        label: `${start.label}, then ${drag.label}`,
      })),
    )
    const failures = [...firstDrags, ...secondDrags]
      .filter(({rect}) => passesValidation(rect, source, field) === false)
      .map(({label, rect}) => `${label}: ${rect.width} × ${rect.height}`)
    expect(failures).toEqual([])
  })
})
