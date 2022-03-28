import type {ReactNode} from 'react'
import type {SortOrdering} from './types'

export interface PrepareViewOptions {
  ordering?: SortOrdering
}
export interface PreviewValue {
  title?: string
  subtitle?: string
  description?: string
  media?:
    | string
    | {_ref: string}
    | {asset: {_ref: string}}
    | {url?: string}
    | {asset: {url: string}}
    | ReactNode
}

export interface PreviewConfig {
  select?: PreviewValue
  prepare: (
    value: {
      title?: unknown
      subtitle?: unknown
      description?: unknown
      media?: unknown
    },
    viewOptions?: PrepareViewOptions
  ) => PreviewValue
}
