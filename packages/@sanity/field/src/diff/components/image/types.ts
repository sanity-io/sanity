export interface Hotspot {
  height: number
  width: number
  x: number
  y: number
}

export interface Crop {
  bottom: number
  left: number
  right: number
  top: number
}

export interface Image {
  [key: string]: any
  asset?: {_ref: string; _weak?: boolean}
  crop?: Crop
  hotspot?: Hotspot
}

export interface ImagePreviewProps {
  value: any // TODO
  action: 'changed' | 'added' | 'removed'
  hotspot?: Hotspot
  crop?: Crop
}
