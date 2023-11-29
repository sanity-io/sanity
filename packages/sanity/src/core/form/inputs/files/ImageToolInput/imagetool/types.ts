import type {Rect} from './2d/shapes'

export type CropMethod = 'full_width' | 'letterbox' | 'full_height'

export interface Hotspot {
  x: number
  y: number
  height: number
  width: number
}

export interface Crop {
  top: number
  right: number
  bottom: number
  left: number
}

export interface EdgeOffsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CropAndHotspot {
  hotspot: Hotspot
  crop: Crop
}

export interface Offsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Coordinate {
  x: number
  y: number
}

export interface CropHandles {
  left: Rect
  right: Rect
  top: Rect
  topLeft: Rect
  topRight: Rect
  bottom: Rect
  bottomLeft: Rect
  bottomRight: Rect
}

export interface ToolCanvasProps {
  value: Partial<CropAndHotspot>
  image: HTMLCanvasElement
  onChange: (value: {hotspot: Hotspot} | {crop: Crop}) => void
  onChangeEnd: (value: {hotspot: Hotspot} | {crop: Crop}) => void
  readOnly: boolean
}

export interface ToolCanvasState {
  cropping: keyof CropHandles | false
  resizing: boolean
  moving: boolean
  cropMoving: boolean
  pointerPosition: Coordinate | null
}
