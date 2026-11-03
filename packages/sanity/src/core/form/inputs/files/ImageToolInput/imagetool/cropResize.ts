import {
  type ImagePixelRect,
  largestSizeForRatio,
  nearestAllowedRatio,
  type ResolvedImageAspectRatio,
} from '@sanity/util/image'

import {MIN_CROP_SIZE} from './constants'
import {type Size, type ToolHandleType} from './types'

type AxisDirection = -1 | 0 | 1

/**
 * Which edges a handle drags. On each axis `1` drags the far edge (right or bottom), `-1` the near
 * edge (left or top), and `0` leaves the axis to follow the ratio, centred on its midpoint.
 */
export interface ResizeDirection {
  dx: AxisDirection
  dy: AxisDirection
}

export const HANDLE_DIRECTIONS: Record<ToolHandleType, ResizeDirection> = {
  'crop-top': {dx: 0, dy: -1},
  'crop-right': {dx: 1, dy: 0},
  'crop-bottom': {dx: 0, dy: 1},
  'crop-left': {dx: -1, dy: 0},
  'crop-topLeft': {dx: -1, dy: -1},
  'crop-topRight': {dx: 1, dy: -1},
  'crop-bottomLeft': {dx: -1, dy: 1},
  'crop-bottomRight': {dx: 1, dy: 1},
}

export interface CropResizeOptions {
  aspectRatio?: ResolvedImageAspectRatio
  /** The smallest crop in source pixels, from {@link getMinimumCropSize}. */
  minimum: Size
  /** Holds the crop's current ratio instead of reading one from the pointer. */
  lockRatio?: boolean
  /** Grows and shrinks the crop evenly about its centre. */
  fromCenter?: boolean
}

/**
 * The smallest crop the handles allow, in source pixels: `minDimensions` when the source can hold
 * it, and never less than the tool's fractional floor. A source smaller than `minDimensions` keeps
 * only the floor, so the tool stays usable and validation reports the size instead.
 */
export function getMinimumCropSize(source: Size, minDimensions?: Size): Size {
  const floor = {width: source.width * MIN_CROP_SIZE, height: source.height * MIN_CROP_SIZE}
  const sourceHoldsMinimum =
    minDimensions !== undefined &&
    minDimensions.width <= source.width &&
    minDimensions.height <= source.height

  return sourceHoldsMinimum
    ? {
        width: Math.max(floor.width, minDimensions.width),
        height: Math.max(floor.height, minDimensions.height),
      }
    : floor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

interface Axis {
  start: number
  length: number
  direction: AxisDirection
  centered: boolean
  sourceLength: number
}

function getAnchor({start, length, direction, centered}: Axis): number {
  if (centered) return start + length / 2
  return direction > 0 ? start : start + length
}

function getAvailableLength(axis: Axis, anchor: number): number {
  if (axis.centered) return 2 * Math.min(anchor, axis.sourceLength - anchor)
  return axis.direction > 0 ? axis.sourceLength - anchor : anchor
}

function getPointerLength(axis: Axis, anchor: number, pointer: number): number {
  if (axis.centered) return 2 * Math.abs(pointer - anchor)
  return Math.max(0, axis.direction * (pointer - anchor))
}

function getStart(axis: Axis, anchor: number, length: number): number {
  if (axis.centered) return anchor - length / 2
  return axis.direction > 0 ? anchor : anchor - length
}

/**
 * Resizes a crop by dragging the edges `direction` names toward `pointer`, all in source pixels.
 *
 * The opposite edge stays fixed while the dragged edge follows the pointer; an axis the handle
 * leaves free (or every axis, with `fromCenter`) keeps its midpoint fixed instead. A side handle
 * holds the perpendicular size, so the ratio follows the dragged edge, and the perpendicular axis
 * only changes when the ratio has to be clamped to the range or snapped to a listed ratio. A
 * corner reads its ratio from the pointer unless `lockRatio` is set.
 *
 * The result stays inside the image, keeps its ratio within the constraint (snapping to the
 * nearest listed ratio when there are any) and does not shrink below `minimum`, unless the room
 * left between the anchor and the image edge is smaller than that.
 */
export function resizeCropRect(
  rect: ImagePixelRect,
  direction: ResizeDirection,
  pointer: {x: number; y: number},
  source: Size,
  options: CropResizeOptions,
): ImagePixelRect {
  const {aspectRatio, minimum, lockRatio = false, fromCenter = false} = options

  const xAxis: Axis = {
    start: rect.x,
    length: rect.width,
    direction: direction.dx,
    centered: fromCenter || direction.dx === 0,
    sourceLength: source.width,
  }
  const yAxis: Axis = {
    start: rect.y,
    length: rect.height,
    direction: direction.dy,
    centered: fromCenter || direction.dy === 0,
    sourceLength: source.height,
  }

  const anchorX = getAnchor(xAxis)
  const anchorY = getAnchor(yAxis)
  const availableWidth = getAvailableLength(xAxis, anchorX)
  const availableHeight = getAvailableLength(yAxis, anchorY)

  const pointerWidth = clamp(
    getPointerLength(xAxis, anchorX, clamp(pointer.x, 0, source.width)),
    minimum.width,
    availableWidth,
  )
  const pointerHeight = clamp(
    getPointerLength(yAxis, anchorY, clamp(pointer.y, 0, source.height)),
    minimum.height,
    availableHeight,
  )

  const askedRatio = getAskedRatio({rect, direction, lockRatio, pointerWidth, pointerHeight})
  const ratio = nearestAllowedRatio(askedRatio, aspectRatio)

  const targetWidth = direction.dx === 0 ? pointerHeight * ratio : pointerWidth
  const fitted = largestSizeForRatio(
    {width: Math.min(targetWidth, availableWidth), height: availableHeight},
    ratio,
  )

  const requiredWidth = Math.min(
    Math.max(minimum.width, minimum.height * ratio),
    availableWidth,
    availableHeight * ratio,
  )
  const width = Math.max(fitted.width, requiredWidth)
  const height = width > fitted.width ? width / ratio : fitted.height

  return {
    x: getStart(xAxis, anchorX, width),
    y: getStart(yAxis, anchorY, height),
    width,
    height,
  }
}

function getAskedRatio(params: {
  rect: ImagePixelRect
  direction: ResizeDirection
  lockRatio: boolean
  pointerWidth: number
  pointerHeight: number
}): number {
  const {rect, direction, lockRatio, pointerWidth, pointerHeight} = params
  if (lockRatio) return rect.width / rect.height
  if (direction.dx === 0) return rect.width / pointerHeight
  if (direction.dy === 0) return pointerWidth / rect.height
  return pointerWidth / pointerHeight
}
