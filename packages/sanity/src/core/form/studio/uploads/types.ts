import {type SanityClient} from '@sanity/client'
import {type AssetMetadataType, type AssetSourceSpec, type SchemaType} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type FormPatch} from '../../patch'

/**
 *
 * @hidden
 * @beta
 */
export type UploadProgressEvent = {
  type: 'uploadProgress'
  patches: FormPatch[] | null
}

/**
 *
 * @hidden
 * @beta
 */
export type ResolvedUploader = {uploader: Uploader; type: SchemaType}

/**
 *
 * @hidden
 * @beta
 */
export type UploadOptions = {
  metadata?: AssetMetadataType[]
  storeOriginalFilename?: boolean
  label?: string
  title?: string
  description?: string
  creditLine?: string
  source?: AssetSourceSpec
}

/**
 * @internal
 */
export type UploaderDef = {
  type: string
  accepts: string
  upload: (client: SanityClient, file: File, type: SchemaType) => Observable<UploadProgressEvent>
}

/**
 *
 * @hidden
 * @beta
 */
export type Uploader<S extends SchemaType = SchemaType> = {
  type: string
  accepts: string
  upload: (
    client: SanityClient,
    file: File,
    type: S,
    options?: UploadOptions,
  ) => Observable<UploadProgressEvent>
  priority: number
}

/**
 *
 * @hidden
 * @beta
 */
export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

/**
 *
 * @hidden
 * @beta
 */
export type UploaderResolver<S extends SchemaType = SchemaType> = (
  type: S,
  file: FileLike,
) => Uploader<S> | null
