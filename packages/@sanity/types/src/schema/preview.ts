import type {ReactNode} from 'react'
import {SortOrdering} from './types'

export interface PrepareViewOptions {
  ordering?: SortOrdering
}
export interface PreviewValue {
  title?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  media?: ReactNode
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
