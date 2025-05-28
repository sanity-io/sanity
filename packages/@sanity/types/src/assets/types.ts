import {type ComponentType} from 'react'

import {type SanityDocument} from '../documents'
import {type Reference} from '../reference'
import {type FileSchemaType, type ImageSchemaType, type SchemaType} from '../schema'

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
  mediaLibraryProps?: {
    mediaLibraryId: string
    assetId: string
    assetInstanceId: string
  }
}

/** @public */
export interface AssetSourceComponentProps {
  action?: 'select' | 'upload'
  assetSource: AssetSource
  assetType?: 'file' | 'image'
  accept: string
  selectionType: 'single'
  dialogHeaderTitle?: React.ReactNode
  selectedAssets: Asset[]
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  schemaType?: ImageSchemaType | FileSchemaType
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
  /** @beta */
  uploader?: AssetSourceUploader
}

/** @beta */
export interface AssetSourceUploadFile {
  id: string
  file: globalThis.File
  progress: number // 0 to 100
  status: 'pending' | 'uploading' | 'complete' | 'error' | 'aborted'
  error?: Error
  result?: unknown // The upload result in the source
}
/** @beta */
export interface AssetSourceUploader {
  upload(
    files: globalThis.File[],
    options?: {
      /**
       * The schema type of the field the asset is being uploaded to.
       * May be of interest to the uploader to read file and image options.
       */
      schemaType?: SchemaType
      /**
       * The uploader may send patches directly to the field
       * Typed 'unknown' as we don't have patch definitions in sanity/types yet.
       */
      onChange?: (patch: unknown) => void
    },
  ): AssetSourceUploadFile[]
  /**
   * Abort the upload of a file
   */
  abort(file?: AssetSourceUploadFile): void
  /**
   * Get the files that are currently being uploaded
   */
  getFiles(): AssetSourceUploadFile[]
  /**
   * Subscribe to upload events from the uploader
   */
  subscribe(subscriber: (event: AssetSourceUploadEvent) => void): () => void
  /**
   * Update the status of a file. Will be emitted to subscribers.
   */
  updateFile(fileId: string, data: {progress?: number; status?: string; error?: Error}): void
  /**
   * Reset the uploader (clear files). Should be called by the uploader when all files are done.
   */
  reset(): void
}

/**
 * Emitted when a file upload is progressing
 * @beta */
export type AssetSourceUploadEventProgress = {
  type: 'progress'
  file: AssetSourceUploadFile
  progress: number
}

/**
 * Emitted when a file upload is changing status
 * @beta */
export type AssetSourceUploadEventStatus = {
  type: 'status'
  file: AssetSourceUploadFile
  status: AssetSourceUploadFile['status']
}

/**
 * Emitted when all files are done, either successfully, aborted or with errors
 * @beta */
export type AssetSourceUploadEventAllComplete = {
  type: 'all-complete'
  files: AssetSourceUploadFile[]
}

/**
 * Emitted when all files are done, either successfully, aborted or with errors
 * @beta */
export type AssetSourceUploadEventError = {
  type: 'error'
  /**
   * Files errored
   */
  files: AssetSourceUploadFile[]
}

/**
 * Emitted when all files are done, either successfully, aborted or with errors
 * @beta */
export type AssetSourceUploadEventAbort = {
  type: 'abort'
  /**
   * Files aborted
   */
  files: AssetSourceUploadFile[]
}

/** @beta */
export type AssetSourceUploadEvent =
  | AssetSourceUploadEventProgress
  | AssetSourceUploadEventStatus
  | AssetSourceUploadEventAllComplete
  | AssetSourceUploadEventError
  | AssetSourceUploadEventAbort

/** @beta */
export type AssetSourceUploadSubscriber = (event: AssetSourceUploadEvent) => void
