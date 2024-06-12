import {type Image as BaseImage, type UploadState} from '@sanity/types'

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
