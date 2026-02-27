import {DEFAULT_CROP, DEFAULT_HOTSPOT, MIN_CROP_SIZE} from './constants'
import {
  type Coordinate,
  type Crop,
  type CropAndHotspot,
  type Hotspot,
  type Rect,
  type ToolHandleType,
  type ToolInteractionTarget,
} from './types'

export const getRectCenterX = (rect: Rect) => rect.left + rect.width / 2
export const getRectCenterY = (rect: Rect) => rect.top + rect.height / 2
export const getRectRight = (rect: Rect) => rect.left + rect.width
export const getRectBottom = (rect: Rect) => rect.top + rect.height

/**
 * Gets normalized dimensions and boundaries from a crop object
 */
export const getCropDimensions = (crop: Crop) => {
  return {
    width: 1 - crop.left - crop.right,
    height: 1 - crop.top - crop.bottom,
    left: crop.left,
    right: 1 - crop.right,
    top: crop.top,
    bottom: 1 - crop.bottom,
  }
}

/**
 * Converts pointer event coordinates to image coordinates
 */
export const getPointerPosition = (
  e: React.PointerEvent,
  svg: SVGSVGElement,
  size: {width: number; height: number},
): {x: number; y: number} => {
  const rect = svg.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * size.width,
    y: ((e.clientY - rect.top) / rect.height) * size.height,
  }
}

/**
 * Calculates the normalized delta between two pointer positions relative to a bounding rectangle.
 */
const calculateDelta = (initialPos: Coordinate, currentPos: Coordinate, rect: Rect): Coordinate => {
  return {
    x: (currentPos.x - initialPos.x) / rect.width,
    y: (currentPos.y - initialPos.y) / rect.height,
  }
}

/**
 * Ensures the hotspot stays within the crop boundaries
 */
export const constrainHotspotToCrop = (hotspot: Hotspot, crop: Crop): Hotspot => {
  // Calculate crop dimensions using getCropDimensions utility
  const cropDimensions = getCropDimensions(crop)

  // Adjust hotspot size if crop is too small
  const adjustedWidth = Math.min(hotspot.width, cropDimensions.width)
  const adjustedHeight = Math.min(hotspot.height, cropDimensions.height)

  // Calculate boundaries for hotspot center
  const minX = cropDimensions.left + adjustedWidth / 2
  const maxX = cropDimensions.right - adjustedWidth / 2
  const minY = cropDimensions.top + adjustedHeight / 2
  const maxY = cropDimensions.bottom - adjustedHeight / 2

  return {
    x: Math.min(Math.max(hotspot.x, minX), maxX),
    y: Math.min(Math.max(hotspot.y, minY), maxY),
    width: adjustedWidth,
    height: adjustedHeight,
  }
}

/**
 * Handles hotspot moving
 */
export const applyHotspotMoveBy = (value: Partial<CropAndHotspot>, delta: Coordinate): Hotspot => {
  const {x, y, width, height} = value.hotspot || DEFAULT_HOTSPOT
  const crop = value.crop || DEFAULT_CROP

  // Move the hotspot by the delta amount, and ensure it stays within crop boundaries
  return constrainHotspotToCrop(
    {
      x: x + delta.x,
      y: y + delta.y,
      width,
      height,
    },
    crop,
  )
}

export const handleHotspotMove = (
  value: Partial<CropAndHotspot>,
  initialPosition: {x: number; y: number},
  pointerPos: {x: number; y: number},
  innerRect: Rect,
): CropAndHotspot => {
  const delta = calculateDelta(initialPosition, pointerPos, innerRect)
  const crop = value.crop || DEFAULT_CROP

  return {
    crop,
    hotspot: applyHotspotMoveBy(value, delta),
  }
}

/**
 * Handles hotspot resizing
 */
interface HotspotResizeParams {
  initialHotspot: Hotspot
  crop: Crop
  initialCursor: Coordinate
  pointerPos: Coordinate
  innerRect: Rect
}

export const handleHotspotResize = (params: HotspotResizeParams): CropAndHotspot => {
  const {initialHotspot, crop, initialCursor, pointerPos, innerRect} = params

  // Use getCropDimensions for crop calculations
  const dimensions = getCropDimensions(crop)
  const netWidth = dimensions.width
  const netHeight = dimensions.height
  const cropLeft = dimensions.left
  const cropRight = dimensions.right
  const cropTop = dimensions.top
  const cropBottom = dimensions.bottom

  // Calculate the delta in cursor position since drag started
  const deltaX = pointerPos.x - initialCursor.x
  const deltaY = pointerPos.y - initialCursor.y

  // Always use bottom-right direction for consistency
  // This means positive delta = grow, negative delta = shrink
  const factorX = deltaX
  const factorY = deltaY

  // Initial hotspot dimensions in pixels
  const initialWidthPx = initialHotspot.width * innerRect.width
  const initialHeightPx = initialHotspot.height * innerRect.height

  // Calculate new dimensions in pixels
  // We use a 2x multiplier because moving the handle by 1px should change the diameter by 2px
  const newWidthPx = initialWidthPx + factorX * 2
  const newHeightPx = initialHeightPx + factorY * 2

  // Convert back to normalized coordinates
  let newWidth = newWidthPx / innerRect.width
  let newHeight = newHeightPx / innerRect.height

  // Ensure minimum size
  newWidth = Math.max(0, newWidth)
  newHeight = Math.max(0, newHeight)

  // Cap dimensions to the crop area size
  newWidth = Math.min(newWidth, netWidth)
  newHeight = Math.min(newHeight, netHeight)

  // Calculate new hotspot position that keeps it within crop bounds
  let newX = initialHotspot.x
  let newY = initialHotspot.y

  // Adjust position if necessary to keep hotspot within crop bounds
  // For X position
  const minX = cropLeft + newWidth / 2
  const maxX = cropRight - newWidth / 2

  if (newX < minX) {
    newX = minX
  } else if (newX > maxX) {
    newX = maxX
  }

  // For Y position
  const minY = cropTop + newHeight / 2
  const maxY = cropBottom - newHeight / 2

  if (newY < minY) {
    newY = minY
  } else if (newY > maxY) {
    newY = maxY
  }

  const newHotspot = {
    ...initialHotspot,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  }

  return {
    crop,
    hotspot: newHotspot,
  }
}

/**
 * Handles crop area moving
 */
interface CropMoveParams {
  initialCrop: Crop
  initialHotspot: Hotspot
  initialCursor: {x: number; y: number}
  pointerPos: {x: number; y: number}
  innerRect: Rect
}

export const handleCropMove = (params: CropMoveParams): CropAndHotspot => {
  const {initialCrop, initialHotspot, initialCursor, pointerPos, innerRect} = params
  const delta = calculateDelta(initialCursor, pointerPos, innerRect)

  const {
    top: initialTop,
    right: initialRight,
    bottom: initialBottom,
    left: initialLeft,
  } = initialCrop

  let newLeft = initialLeft + delta.x
  let newRight = initialRight - delta.x
  let newTop = initialTop + delta.y
  let newBottom = initialBottom - delta.y

  // Use getCropDimensions to get crop dimensions
  const dimensions = getCropDimensions(initialCrop)
  const netWidth = dimensions.width
  const netHeight = dimensions.height

  // Constrain horizontally
  if (newLeft < 0) {
    newLeft = 0
    newRight = 1 - netWidth
  } else if (newRight < 0) {
    newRight = 0
    newLeft = 1 - netWidth
  } else if (newLeft + newRight > 1) {
    if (delta.x > 0) {
      newLeft = 1 - netWidth
      newRight = 0
    } else {
      newLeft = 0
      newRight = 1 - netWidth
    }
  }

  // Constrain vertically
  if (newTop < 0) {
    newTop = 0
    newBottom = 1 - netHeight
  } else if (newBottom < 0) {
    newBottom = 0
    newTop = 1 - netHeight
  } else if (newTop + newBottom > 1) {
    if (delta.y > 0) {
      newTop = 1 - netHeight
      newBottom = 0
    } else {
      newTop = 0
      newBottom = 1 - netHeight
    }
  }

  const newCrop = {
    top: newTop,
    right: newRight,
    bottom: newBottom,
    left: newLeft,
  }

  // Calculate how the crop center has moved
  const initialCropCenterX = 0.5 - (initialLeft + initialRight) / 2
  const initialCropCenterY = 0.5 - (initialTop + initialBottom) / 2
  const newCropCenterX = 0.5 - (newLeft + newRight) / 2
  const newCropCenterY = 0.5 - (newTop + newBottom) / 2

  const cropCenterDeltaX = newCropCenterX - initialCropCenterX
  const cropCenterDeltaY = newCropCenterY - initialCropCenterY

  // Move the hotspot by the same amount as the crop center
  const newHotspot = {
    ...initialHotspot,
    x: initialHotspot.x + cropCenterDeltaX,
    y: initialHotspot.y + cropCenterDeltaY,
  }

  const adjustedHotspot = constrainHotspotToCrop(newHotspot, newCrop)

  return {
    crop: newCrop,
    hotspot: adjustedHotspot,
  }
}

/**
 * Handles crop handle resizing
 */
interface CropHandleResizeParams {
  initialCrop: Crop
  initialHotspot: Hotspot
  initialCursor: {x: number; y: number}
  pointerPos: {x: number; y: number}
  innerRect: Rect
  activeHandle: ToolHandleType
}

export const handleCropHandleResize = (params: CropHandleResizeParams): CropAndHotspot => {
  const {initialCrop, initialHotspot, initialCursor, pointerPos, innerRect, activeHandle} = params

  // Extract handle position (remove 'crop-' prefix)
  const handlePosition = activeHandle.startsWith('crop-') ? activeHandle.slice(5) : ''

  const delta = calculateDelta(initialCursor, pointerPos, innerRect)

  // Start with initial crop values
  let {left, right, top, bottom} = initialCrop

  // Determine boundaries to prevent crop from going outside the image
  const minLeft = 0
  const minTop = 0

  // Update crop based on which handle is being dragged
  switch (handlePosition) {
    case 'left':
      left = Math.min(
        Math.max(initialCrop.left + delta.x, minLeft),
        1 - initialCrop.right - MIN_CROP_SIZE,
      )
      break

    case 'right':
      right = Math.min(
        Math.max(initialCrop.right - delta.x, minLeft),
        1 - initialCrop.left - MIN_CROP_SIZE,
      )
      break

    case 'top':
      top = Math.min(
        Math.max(initialCrop.top + delta.y, minTop),
        1 - initialCrop.bottom - MIN_CROP_SIZE,
      )
      break

    case 'bottom':
      bottom = Math.min(
        Math.max(initialCrop.bottom - delta.y, minTop),
        1 - initialCrop.top - MIN_CROP_SIZE,
      )
      break

    case 'topLeft':
      left = Math.min(
        Math.max(initialCrop.left + delta.x, minLeft),
        1 - initialCrop.right - MIN_CROP_SIZE,
      )
      top = Math.min(
        Math.max(initialCrop.top + delta.y, minTop),
        1 - initialCrop.bottom - MIN_CROP_SIZE,
      )
      break

    case 'topRight':
      right = Math.min(
        Math.max(initialCrop.right - delta.x, minLeft),
        1 - initialCrop.left - MIN_CROP_SIZE,
      )
      top = Math.min(
        Math.max(initialCrop.top + delta.y, minTop),
        1 - initialCrop.bottom - MIN_CROP_SIZE,
      )
      break

    case 'bottomLeft':
      left = Math.min(
        Math.max(initialCrop.left + delta.x, minLeft),
        1 - initialCrop.right - MIN_CROP_SIZE,
      )
      bottom = Math.min(
        Math.max(initialCrop.bottom - delta.y, minTop),
        1 - initialCrop.top - MIN_CROP_SIZE,
      )
      break

    case 'bottomRight':
      right = Math.min(
        Math.max(initialCrop.right - delta.x, minLeft),
        1 - initialCrop.left - MIN_CROP_SIZE,
      )
      bottom = Math.min(
        Math.max(initialCrop.bottom - delta.y, minTop),
        1 - initialCrop.top - MIN_CROP_SIZE,
      )
      break

    default:
      // No action for unrecognized handles
      break
  }

  // Create new crop and constrain hotspot to it
  const newCrop = {left, right, top, bottom}
  const newHotspot = constrainHotspotToCrop(initialHotspot, newCrop)

  return {
    crop: newCrop,
    hotspot: newHotspot,
  }
}

const HANDLE_CURSOR_MAP: Record<string, string> = {
  'crop-top': 'ns-resize',
  'crop-bottom': 'ns-resize',
  'crop-left': 'ew-resize',
  'crop-right': 'ew-resize',
  'crop-topRight': 'nesw-resize',
  'crop-bottomLeft': 'nesw-resize',
  'crop-topLeft': 'nwse-resize',
  'crop-bottomRight': 'nwse-resize',
}

export const calculateCurrentCursor = (
  dragTarget: ToolInteractionTarget | null,
  activeHandle: ToolHandleType | null,
  hoverTarget: ToolInteractionTarget | ToolHandleType | null,
): string => {
  // When dragging
  if (dragTarget === 'crop' || dragTarget === 'hotspot') {
    return 'grabbing'
  }
  if (dragTarget === 'hotspotHandle') {
    return 'move'
  }
  if (dragTarget === 'cropHandle' && activeHandle) {
    return HANDLE_CURSOR_MAP[activeHandle] || 'move'
  }

  // When hovering
  if (!hoverTarget) return 'default'

  if (hoverTarget === 'crop' || hoverTarget === 'hotspot') {
    return 'grab'
  }

  if (hoverTarget === 'hotspotHandle') {
    return 'move'
  }

  if (typeof hoverTarget === 'string' && hoverTarget in HANDLE_CURSOR_MAP) {
    return HANDLE_CURSOR_MAP[hoverTarget]
  }

  return 'default'
}
