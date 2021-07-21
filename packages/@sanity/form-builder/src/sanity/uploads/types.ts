import {Observable} from 'rxjs'
import {AssetSourceSpec, SchemaType, AssetMetadataType} from '@sanity/types'
import type {Patch} from '../../patch/types'

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

export interface FileIsh {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

export type UploaderResolver = (type: SchemaType, file: FileIsh) => Uploader | null
