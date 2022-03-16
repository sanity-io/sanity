import {Observable} from 'rxjs'
import {Patch} from '@sanity/base/_internal'
import {AssetSourceSpec, SchemaType, AssetMetadataType} from '@sanity/types'

export type UploadEvent = {
  type: 'uploadEvent'
  patches: Patch[] | null
}

export type ResolvedUploader = {uploader: Uploader; type: SchemaType}

export type UploadOptions = {
  metadata?: AssetMetadataType[]
  storeOriginalFilename?: boolean
  label?: string
  title?: string
  description?: string
  creditLine?: string
  source?: AssetSourceSpec
}

export type UploaderDef = {
  type: string
  accepts: string
  upload: (file: File, type: SchemaType) => Observable<UploadEvent>
}

export type Uploader = {
  type: string
  accepts: string
  upload: (file: File, type: SchemaType, options?: UploadOptions) => Observable<UploadEvent>
  priority: number
}

export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

export type UploaderResolver = (type: SchemaType, file: FileLike) => Uploader | null
