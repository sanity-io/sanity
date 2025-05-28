import {HANDLE_INTERACTIVE_SIZE, HANDLE_VISUAL_SIZE_CROP} from './constants'
import {type Rect} from './types'
import {getRectBottom, getRectCenterX, getRectCenterY, getRectRight} from './utils'

type CropHandleRect = {
  visual: Rect
  hit: Rect
  path?: string
  position?: {x: number; y: number}
  rotation?: number
}

export const getHotspotHandlePosition = (hotspotRect: Rect) => {
  const angle = Math.PI * 0.25
  const rx = hotspotRect.width / 2
  const ry = hotspotRect.height / 2

  return {
    x: getRectCenterX(hotspotRect) + Math.cos(angle) * rx,
    y: getRectCenterY(hotspotRect) + Math.sin(angle) * ry,
  }
}

const HANDLE_TEMPLATES = {
  CORNER_PATH: (size: number) => {
    const half = size / 2
    // Single corner path that will be rotated for each orientation
    // Define equivalent to the topLeft orientation
    return `M ${-half} ${size * 1.5} 
            L ${-half} ${-half} 
            L ${size * 1.5} ${-half} 
            L ${size * 1.5} ${half} 
            L ${half} ${half} 
            L ${half} ${size * 1.5} 
            Z`
  },
  EDGE_DIMENSIONS: {
    top: (size: number) => ({width: size * 2, height: size}),
    right: (size: number) => ({width: size, height: size * 2}),
    bottom: (size: number) => ({width: size * 2, height: size}),
    left: (size: number) => ({width: size, height: size * 2}),
  },
} as const

const HANDLE_PATHS = {
  cornerPath: HANDLE_TEMPLATES.CORNER_PATH(HANDLE_VISUAL_SIZE_CROP),
  edgeDimensions: {
    top: HANDLE_TEMPLATES.EDGE_DIMENSIONS.top(HANDLE_VISUAL_SIZE_CROP),
    right: HANDLE_TEMPLATES.EDGE_DIMENSIONS.right(HANDLE_VISUAL_SIZE_CROP),
    bottom: HANDLE_TEMPLATES.EDGE_DIMENSIONS.bottom(HANDLE_VISUAL_SIZE_CROP),
    left: HANDLE_TEMPLATES.EDGE_DIMENSIONS.left(HANDLE_VISUAL_SIZE_CROP),
  },
} as const

export const calculateCropHandles = (cropRect: Rect) => {
  const hitAreaSize = HANDLE_INTERACTIVE_SIZE
  const halfHitAreaSize = hitAreaSize / 2
  const edgeHitWidth = HANDLE_INTERACTIVE_SIZE

  // Define handle positions based on cropRect
  const positions = {
    top: {x: cropRect.left + cropRect.width / 2, y: cropRect.top},
    right: {x: getRectRight(cropRect), y: cropRect.top + cropRect.height / 2},
    bottom: {x: cropRect.left + cropRect.width / 2, y: getRectBottom(cropRect)},
    left: {x: cropRect.left, y: cropRect.top + cropRect.height / 2},
    topLeft: {x: cropRect.left, y: cropRect.top},
    topRight: {x: getRectRight(cropRect), y: cropRect.top},
    bottomLeft: {x: cropRect.left, y: getRectBottom(cropRect)},
    bottomRight: {x: getRectRight(cropRect), y: getRectBottom(cropRect)},
  }

  const rotations = {
    topLeft: 0,
    topRight: 90,
    bottomRight: 180,
    bottomLeft: 270,
  }

  const result: Record<string, CropHandleRect> = {}

  // Create edge handles
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
    const dims = HANDLE_PATHS.edgeDimensions[edge]
    const pos = positions[edge]

    result[edge] = {
      visual: {
        left: pos.x - dims.width / 2,
        top: pos.y - dims.height / 2,
        width: dims.width,
        height: dims.height,
      },
      hit: {
        left:
          edge === 'left' || edge === 'right'
            ? pos.x - edgeHitWidth / 2
            : pos.x - HANDLE_INTERACTIVE_SIZE / 2,
        top:
          edge === 'top' || edge === 'bottom'
            ? pos.y - edgeHitWidth / 2
            : pos.y - HANDLE_INTERACTIVE_SIZE / 2,
        width: edge === 'left' || edge === 'right' ? edgeHitWidth : HANDLE_INTERACTIVE_SIZE,
        height: edge === 'top' || edge === 'bottom' ? edgeHitWidth : HANDLE_INTERACTIVE_SIZE,
      },
    }
  }

  // Create corner handles
  for (const corner of ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const) {
    const pos = positions[corner]

    result[corner] = {
      visual: {
        left: pos.x - HANDLE_INTERACTIVE_SIZE,
        top: pos.y - HANDLE_INTERACTIVE_SIZE,
        width: HANDLE_INTERACTIVE_SIZE * 2,
        height: HANDLE_INTERACTIVE_SIZE * 2,
      },
      hit: {
        left: pos.x - halfHitAreaSize,
        top: pos.y - halfHitAreaSize,
        width: hitAreaSize,
        height: hitAreaSize,
      },
      path: HANDLE_PATHS.cornerPath,
      position: pos,
      rotation: rotations[corner],
    }
  }

  return result
}
