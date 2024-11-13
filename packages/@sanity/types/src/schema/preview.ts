import {type ElementType, type ReactNode} from 'react'

import {type UploadState} from '../upload'
import {type SortOrdering} from './types'

/** @public */
export interface PrepareViewOptions {
  /** @beta */
  ordering?: SortOrdering
}

/** @public */
export interface UserPreparedPreviewValue {
  title?: string
  subtitle?: string
  description?: string
  media?: ReactNode | ElementType
  imageUrl?: string
}

/** @public */
export interface PreviewValue extends UserPreparedPreviewValue {
  _id?: string
  _type?: string
  _upload?: UploadState
  _createdAt?: string
  _updatedAt?: string
}

/** @public */
export interface PreviewConfig<
  Select extends Record<string, string> = Record<string, string>,
  PrepareValue extends Record<keyof Select, any> = Record<keyof Select, any>,
> {
  select?: Select
  prepare?: (value: PrepareValue, viewOptions?: PrepareViewOptions) => UserPreparedPreviewValue
}
