import {type SanityClient} from '@sanity/client'
import {
  type AssetSource,
  type Image as BaseImage,
  type ImageAsset,
  type ImageSchemaType,
  type UploadState,
} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type UploaderResolver} from '../../../studio/uploads/types'
import {type ObjectInputProps} from '../../../types'
import {type ImageUrlBuilder} from '../types'

/**
 * @hidden
 * @internal
 */
export type FileInfo = {
  type: string // mime type
  kind: string // 'file' or 'string'
}

/**
 * @hidden
 * @beta
 */
export interface BaseImageInputValue extends Partial<BaseImage> {
  _upload?: UploadState
}

/**
 * @hidden
 * @beta */
export interface BaseImageInputProps
  extends ObjectInputProps<BaseImageInputValue, ImageSchemaType> {
  assetSources: AssetSource[]
  directUploads?: boolean
  imageUrlBuilder: ImageUrlBuilder
  observeAsset: (documentId: string) => Observable<ImageAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
  t: (key: string, values?: Record<string, string>) => string
}
