import {SanityClient} from '@sanity/client'
import {AssetSourceSpec, SchemaType, AssetMetadataType} from '@sanity/types'
import {Observable} from 'rxjs'
import {FormPatch} from '../../patch'

/** @public */
export type UploadEvent = {
  type: 'uploadEvent'
  /** @beta */
  patches: FormPatch[] | null
}

/** @internal */
export type ResolvedUploader = {uploader: Uploader; type: SchemaType}

/** @public */
export type UploadOptions = {
  metadata?: AssetMetadataType[]
  storeOriginalFilename?: boolean
  label?: string
  title?: string
  description?: string
  creditLine?: string
  source?: AssetSourceSpec
}

/** @internal */
export type UploaderDef = {
  type: string
  accepts: string
  upload: (client: SanityClient, file: File, type: SchemaType) => Observable<UploadEvent>
}

/** @public */
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

/** @public */
export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

/** @public */
export type UploaderResolver = (type: SchemaType, file: FileLike) => Uploader | null
