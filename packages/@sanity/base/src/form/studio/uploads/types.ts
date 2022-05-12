import {SanityClient} from '@sanity/client'
import {AssetSourceSpec, SchemaType, AssetMetadataType} from '@sanity/types'
import {Observable} from 'rxjs'
import {FormPatch} from '../../patch'

export type UploadEvent = {
  type: 'uploadEvent'
  patches: FormPatch[] | null
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
  upload: (client: SanityClient, file: File, type: SchemaType) => Observable<UploadEvent>
}

export type Uploader = {
  type: string
  accepts: string
  upload: (
    client: SanityClient,
    file: File,
    type: SchemaType,
    options?: UploadOptions
  ) => Observable<UploadEvent>
  priority: number
}

export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

export type UploaderResolver = (type: SchemaType, file: FileLike) => Uploader | null
