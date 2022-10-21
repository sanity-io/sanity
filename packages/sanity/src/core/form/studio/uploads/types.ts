import {SanityClient} from '@sanity/client'
import {AssetSourceSpec, SchemaType, AssetMetadataType} from '@sanity/types'
import {Observable} from 'rxjs'
import {FormPatch} from '../../patch'
/**
 * @beta
 */
export type UploadProgressEvent = {
  type: 'uploadProgress'
  patches: FormPatch[] | null
}

/**
 * @beta
 */
export type ResolvedUploader = {uploader: Uploader; type: SchemaType}

/**
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
 * @beta
 */
export type Uploader<S extends SchemaType = SchemaType> = {
  type: string
  accepts: string
  upload: (
    client: SanityClient,
    file: File,
    type: S,
    options?: UploadOptions
  ) => Observable<UploadProgressEvent>
  priority: number
}

/**
 * @beta
 */
export interface FileLike {
  // mime type
  type: string
  // file name (e.g. somefile.jpg)
  name?: string
}

/**
 * @beta
 */
export type UploaderResolver<S extends SchemaType = SchemaType> = (
  type: S,
  file: FileLike
) => Uploader<S> | null
