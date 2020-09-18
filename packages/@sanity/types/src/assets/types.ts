import {Reference, SanityDocument} from '../documents'

export interface Image {
  [key: string]: unknown
  asset: Reference
  crop?: ImageCrop
  hotspot?: ImageHotspot
}

export interface Asset extends SanityDocument {
  url: string
  path: string
  assetId: string
  extension: string
  mimeType: string
  sha1hash: string
  size: number
  originalFilename?: string
}

export interface ImageAsset extends Asset {
  _type: 'sanity.imageAsset'
  metadata: ImageMetadata
}

export interface FileAsset extends Asset {
  _type: 'sanity.fileAsset'
  metadata: Record<string, unknown>
}

export interface ImageMetadata {
  [key: string]: unknown
  _type: 'sanity.imageMetadata'
  dimensions: ImageDimensions
  palette?: ImagePalette
  lqip?: string
  hasAlpha: boolean
  isOpaque: boolean
}

export interface ImageDimensions {
  _type: 'sanity.imageDimensions'
  height: number
  width: number
  aspectRatio: number
}

export interface ImageCrop {
  _type?: 'sanity.imageCrop'
  left: number
  bottom: number
  right: number
  top: number
}

export interface ImageHotspot {
  _type: 'sanity.imageHotspot'
  width: number
  height: number
  x: number
  y: number
}

export interface ImagePalette {
  _type: 'sanity.imagePalette'
  darkMuted?: ImageSwatch
  darkVibrant?: ImageSwatch
  dominant?: ImageSwatch
  lightMuted?: ImageSwatch
  lightVibrant?: ImageSwatch
  muted?: ImageSwatch
  vibrant?: ImageSwatch
}

export interface ImageSwatch {
  _type: 'sanity.imagePaletteSwatch'
  background: string
  foreground: string
  population: number
  title?: string
}

export type SwatchName =
  | 'darkMuted'
  | 'darkVibrant'
  | 'dominant'
  | 'lightMuted'
  | 'lightVibrant'
  | 'muted'
  | 'vibrant'
