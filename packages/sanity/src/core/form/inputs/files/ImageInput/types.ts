import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder} from '@sanity/image-url'
import {
  type AssetFromSource,
  type AssetSource,
  type Image as BaseImage,
  type ImageAsset,
  type ImageSchemaType,
  type UploadState,
} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type UploaderResolver} from '../../../studio/uploads/types'
import {type ObjectInputProps} from '../../../types'

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
export interface BaseImageInputProps extends ObjectInputProps<
  BaseImageInputValue,
  ImageSchemaType
> {
  assetSources: AssetSource[]
  directUploads?: boolean
  imageUrlBuilder: ImageUrlBuilder
  isUploading: boolean
  observeAsset: (documentId: string) => Observable<ImageAsset>
  resolveUploader: UploaderResolver
  client: SanityClient
  t: (key: string, values?: Record<string, string>) => string
  /**
   * Optional callback to insert additional images as siblings in an array.
   * Called when multiple images are selected from an asset source in array context.
   * @param assets - The additional assets to insert (after the first one)
   * @param afterKey - The key of the current array item to insert after
   * @beta
   */
  onInsertSiblingImages?: (assets: AssetFromSource[], afterKey: string) => void
}
