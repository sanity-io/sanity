import {type ElementType, type ReactNode} from 'react'

import {type ImageUrlFitMode} from '../images/types'
import {type SortOrdering} from './types'

/** @public */
export interface PrepareViewOptions {
  /** @beta */
  ordering?: SortOrdering
}

/** @public */
export interface PreviewValue {
  _id?: string
  _createdAt?: string
  _updatedAt?: string
  title?: string
  subtitle?: string
  description?: string
  media?: ReactNode | ElementType
  imageUrl?: string
}

/** @public */
export interface PreviewConfig<
  Select extends Record<string, string> = Record<string, string>,
  PrepareValue extends Record<keyof Select, any> = Record<keyof Select, any>,
> {
  select?: Select
  prepare?: (value: PrepareValue, viewOptions?: PrepareViewOptions) => PreviewValue
}

/**
 * Portable text preview layout key
 *
 * @public
 */
export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

/**
 * General preview layout key
 *
 * @public
 */
export type GeneralPreviewLayoutKey = 'compact' | 'default' | 'media' | 'detail'

/**
 * General Document list layout key
 *
 * @hidden
 * @beta
 */
export type GeneralDocumentListLayoutKey = GeneralPreviewLayoutKey | 'sheetList'

/**
 * Preview layout key. See also {@link GeneralPreviewLayoutKey} and {@link PortableTextPreviewLayoutKey}
 *
 * @public
 */
export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

/**
 * @hidden
 * @public
 */
export interface PreviewMediaDimensions {
  aspect?: number
  dpr?: number
  fit?: ImageUrlFitMode
  height?: number
  width?: number
}
