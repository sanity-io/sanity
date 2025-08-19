import {type SanityClient} from '@sanity/client'
import {type SchemaType, type Uploader, type UploadProgressEvent} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 *
 * @hidden
 * @beta
 */
export type ResolvedUploader = {uploader: Uploader; type: SchemaType}

export type {
  FileLike,
  Uploader,
  UploaderResolver,
  UploadOptions,
  UploadProgressEvent,
} from '@sanity/types'

/**
 * @internal
 */
export type UploaderDef = {
  type: string
  accepts: string
  upload: (client: SanityClient, file: File, type: SchemaType) => Observable<UploadProgressEvent>
}
