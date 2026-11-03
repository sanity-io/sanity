import {resolveAspectRatio} from '@sanity/util/image'
import {describe, expect, test} from 'vitest'

import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '../constants'
import {type Crop, type Size, type ToolHandleType} from '../types'
import {handleCropHandleResize} from '../utils'

const INNER_RECT = {left: 12, top: 12, width: 300, height: 200}
const SOURCE: Size = {width: 3000, height: 2000}
const INITIAL_CURSOR = {x: 312, y: 212}

function expectCrop(actual: Crop, expected: Crop) {
  expect(actual.top).toBeCloseTo(expected.top)
  expect(actual.right).toBeCloseTo(expected.right)
  expect(actual.bottom).toBeCloseTo(expected.bottom)
  expect(actual.left).toBeCloseTo(expected.left)
}

function drag(
  activeHandle: ToolHandleType,
  delta: {x: number; y: number},
  options: Partial<Parameters<typeof handleCropHandleResize>[0]> = {},
) {
  return handleCropHandleResize({
    initialCrop: DEFAULT_CROP,
    initialHotspot: DEFAULT_HOTSPOT,
    initialCursor: INITIAL_CURSOR,
    pointerPos: {x: INITIAL_CURSOR.x + delta.x, y: INITIAL_CURSOR.y + delta.y},
    innerRect: INNER_RECT,
    activeHandle,
    sourceSize: SOURCE,
    ...options,
  })
}

describe('handleCropHandleResize', () => {
  test('moves the dragged edges by the pointer movement without constraints', () => {
    const {crop} = drag('crop-bottomRight', {x: -150, y: -100})
    expectCrop(crop, {top: 0, right: 0.5, bottom: 0.5, left: 0})
  })

  test('keeps an edge inside the image', () => {
    const {crop} = drag('crop-left', {x: -60, y: 0}, {initialCrop: {...DEFAULT_CROP, left: 0.1}})
    expectCrop(crop, {top: 0, right: 0, bottom: 0, left: 0})
  })

  test('stops at five percent of the image', () => {
    const {crop} = drag('crop-top', {x: 0, y: 400})
    expectCrop(crop, {top: 0.95, right: 0, bottom: 0, left: 0})
  })

  test('measures the aspect ratio in source pixels', () => {
    const {crop} = drag(
      'crop-bottomRight',
      {x: -150, y: -100},
      {constraints: {aspectRatio: resolveAspectRatio(1)}},
    )
    expectCrop(crop, {top: 0, right: 0.5, bottom: 0.25, left: 0})
  })

  test('stops at the minimum dimensions', () => {
    const {crop} = drag(
      'crop-topLeft',
      {x: 290, y: 190},
      {constraints: {minDimensions: {width: 1200, height: 800}}},
    )
    expectCrop(crop, {top: 0.6, right: 0, bottom: 0, left: 0.6})
  })

  test('falls back to the five percent floor when the image is smaller than the minimum', () => {
    const {crop} = drag(
      'crop-bottomRight',
      {x: -300, y: -200},
      {
        sourceSize: {width: 300, height: 200},
        constraints: {minDimensions: {width: 800, height: 600}},
      },
    )
    expectCrop(crop, {top: 0, right: 0.95, bottom: 0.95, left: 0})
  })

  test('resizes about the centre with fromCenter', () => {
    const {crop} = drag(
      'crop-right',
      {x: -30, y: 0},
      {modifiers: {lockRatio: false, fromCenter: true}},
    )
    expectCrop(crop, {top: 0, right: 0.1, bottom: 0, left: 0.1})
  })

  test('keeps the hotspot inside the new crop', () => {
    const {crop, hotspot} = drag('crop-bottomRight', {x: -150, y: -100})
    expect(hotspot.x - hotspot.width / 2).toBeGreaterThanOrEqual(crop.left)
    expect(hotspot.x + hotspot.width / 2).toBeLessThanOrEqual(1 - crop.right + 1e-9)
    expect(hotspot.y + hotspot.height / 2).toBeLessThanOrEqual(1 - crop.bottom + 1e-9)
  })
})
