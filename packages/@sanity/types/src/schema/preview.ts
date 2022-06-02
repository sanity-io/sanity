import type {ReactNode} from 'react'
import {UploadState} from '../upload'
import type {SortOrdering} from './types'

type FIXME = any

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

  /**
   * @deprecated INTERNAL USE ONLY
   */
  _upload?: UploadState

  /**
   * @deprecated INTERNAL USE ONLY
   */
  extendedPreview?: unknown
}

export interface PreviewConfig {
  component?: React.ComponentType<FIXME>
  select?: Record<string, string> // PreviewValue
  prepare?: (value: Record<string, unknown>, viewOptions?: PrepareViewOptions) => PreviewValue
}
