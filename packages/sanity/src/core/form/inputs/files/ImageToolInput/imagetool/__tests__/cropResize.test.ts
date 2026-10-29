import {type ImagePixelRect, resolveAspectRatio} from '@sanity/util/image'
import {describe, expect, test} from 'vitest'

import {
  getMinimumCropSize,
  HANDLE_DIRECTIONS,
  resizeCropRect,
  type CropResizeOptions,
  type ResizeDirection,
} from '../cropResize'
import {type Size} from '../types'

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
})
