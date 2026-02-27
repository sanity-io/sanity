export type CropMethod = 'full_width' | 'letterbox' | 'full_height'
export interface Size {
  width: number
  height: number
}

export interface Rect extends Size {
  left: number
  top: number
}

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

export interface CropAndHotspot {
  hotspot: Hotspot
  crop: Crop
}

export interface Coordinate {
  x: number
  y: number
}

export interface ToolSVGProps {
  value: Partial<CropAndHotspot>
  image: HTMLImageElement
  onChange: (value: {hotspot: Hotspot} | {crop: Crop}) => void
  onChangeEnd: (value: {hotspot: Hotspot} | {crop: Crop}) => void
  readOnly: boolean
  size: Size
}

export type ToolFocusTarget = 'hotspot' | 'crop'
export type ToolInteractionTarget = ToolFocusTarget | 'hotspotHandle' | 'cropHandle'
export type ToolHandleType =
  | 'crop-top'
  | 'crop-right'
  | 'crop-bottom'
  | 'crop-left'
  | 'crop-topLeft'
  | 'crop-topRight'
  | 'crop-bottomLeft'
  | 'crop-bottomRight'
