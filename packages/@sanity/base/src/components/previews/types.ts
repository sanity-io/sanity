/* eslint-disable import/no-unresolved */
import {FitMode} from '@sanity/image-url/lib/types/types'
import {SchemaType} from '@sanity/types'

export type Id = string

export type Reference = {_ref: string; [key: string]: unknown}
export type Document = {_id: string; [key: string]: unknown}

export type Value = Document | Reference | unknown

export type FieldName = string

export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export {PrepareViewOptions} from '@sanity/types'
export {SortOrdering} from '@sanity/types'

export type PreviewConfig = {
  select: {
    title: string
    subtitle: string
    description: string
  }
}
export type Type = SchemaType

export type PreviewLayoutKey = 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'

export type MediaDimensions = {
  width?: number
  height?: number
  fit?: FitMode
  aspect?: number
}

export interface PreviewProps<LayoutKey = PreviewLayoutKey> {
  children?: React.ReactNode
  description?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  extendedPreview?: unknown
  isPlaceholder?: boolean
  media?:
    | React.ReactNode
    | React.FC<{
        dimensions: MediaDimensions
        layout: LayoutKey
      }>
  progress?: number
  status?: React.ReactNode | React.FC<{layout: LayoutKey}>
  subtitle?: React.ReactNode | React.FC<{layout: LayoutKey}>
  title?: React.ReactNode | React.FC<{layout: LayoutKey}>
}

export type PreviewComponent = React.ComponentType<PreviewProps>
