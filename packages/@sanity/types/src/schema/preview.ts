import {type ElementType, type ReactNode} from 'react'

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
