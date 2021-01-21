import {Observable} from 'rxjs'
import {AssetSourceSpec, SchemaType} from '@sanity/types'
import {AssetMetadataType} from '@sanity/client'
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

export type UploaderResolver = (type: SchemaType, file: File) => Uploader | null
