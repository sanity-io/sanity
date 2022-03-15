import type {ReactNode} from 'react'
import type {SortOrdering} from './types'

export interface PrepareViewOptions {
  ordering?: SortOrdering
}

export interface PreviewValue {
  title?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  media?: ReactNode
  /**
   * optional object used to attach meta data to the prepared result.
   * currently used to add a flag for the invalid preview error fallback and
   * insufficient permissions fallback
   * @internal
   */
  _internalMeta?: {type?: string}
}

export interface PreviewConfig {
  select?: Record<string, string> // PreviewValue
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
