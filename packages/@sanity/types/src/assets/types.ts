import type {ComponentType} from 'react'
import type {Reference} from '../reference'
import type {SanityDocument} from '../documents'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyProps {}

/** @public */
export interface File {
  [key: string]: unknown // We allow meta-fields on file
  asset?: Reference
}

/** @public */
export interface Image {
  [key: string]: unknown // We allow meta-fields on image
  asset?: Reference
  crop?: ImageCrop
  hotspot?: ImageHotspot
}

/** @public */
export interface Asset extends SanityDocument {
  url: string
  path: string
  assetId: string
  extension: string
  mimeType: string
  sha1hash: string
  size: number
  originalFilename?: string

  // Extensions
  label?: string
  title?: string
  description?: string

  // External asset source extensions
  creditLine?: string
  source?: AssetSourceSpec
}

/** @public */
export interface ImageAsset extends Asset {
  _type: 'sanity.imageAsset'
  metadata: ImageMetadata
}

/** @public */
export interface FileAsset extends Asset {
  _type: 'sanity.fileAsset'
  metadata: Record<string, unknown>
}

/** @public */
export interface ImageMetadata {
  [key: string]: unknown
  _type: 'sanity.imageMetadata'
  dimensions: ImageDimensions
  palette?: ImagePalette
  lqip?: string
  blurHash?: string
  hasAlpha: boolean
  isOpaque: boolean
}

/** @public */
export interface ImageDimensions {
  _type: 'sanity.imageDimensions'
  height: number
  width: number
  aspectRatio: number
}

/** @public */
export interface ImageCrop {
  _type?: 'sanity.imageCrop'
  left: number
  bottom: number
  right: number
  top: number
}

/** @public */
export interface ImageHotspot {
  _type?: 'sanity.imageHotspot'
  width: number
  height: number
  x: number
  y: number
}

/** @public */
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

/** @public */
export interface ImageSwatch {
  _type: 'sanity.imagePaletteSwatch'
  background: string
  foreground: string
  population: number
  title?: string
}

/** @public */
export type SwatchName =
  | 'darkMuted'
  | 'darkVibrant'
  | 'dominant'
  | 'lightMuted'
  | 'lightVibrant'
  | 'muted'
  | 'vibrant'

/** @public */
export interface AssetSourceSpec {
  id: string
  name: string
  url?: string
}

/** @public */
export type AssetFromSource = {
  kind: 'assetDocumentId' | 'file' | 'base64' | 'url'
  value: string | File
  assetDocumentProps?: ImageAsset
}

/** @public */
export interface AssetSourceComponentProps {
  assetType?: 'file' | 'image'
  accept: string
  selectionType: 'single'
  dialogHeaderTitle?: React.ReactNode
  selectedAssets: Asset[]
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
}

/** @public */
export type AssetMetadataType =
  | 'location'
  | 'exif'
  | 'image'
  | 'palette'
  | 'lqip'
  | 'blurhash'
  | 'none'

/** @public */
export interface AssetSource {
  name: string
  /** @deprecated provide `i18nKey` instead */
  title?: string

  i18nKey?: string
  component: ComponentType<AssetSourceComponentProps>
  icon?: ComponentType<EmptyProps>
}
