import {ObjectDiff} from '../../../diff'

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

export interface SanityImageAsset {
  _id: string
  url: string
  path: string
  originalFilename?: string
  metadata: {
    dimensions: {
      width: number
      height: number
      aspectRatio: number
    }
  }
}

export interface ImagePreviewProps {
  diff: ObjectDiff<Image>
  asset: SanityImageAsset
  hotspot?: Hotspot
  crop?: Crop
  is: 'from' | 'to'
  action?: 'changed' | 'added' | 'removed'
}
