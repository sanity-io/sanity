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
  imageUrl?: string
}

export interface PreviewConfig {
  component?: React.ComponentType<any>
  select?: Record<string, any>
  prepare?: (value: Record<string, unknown>, viewOptions?: PrepareViewOptions) => PreviewValue
}
