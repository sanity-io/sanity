import {ImageUrlFitMode, SchemaType} from '@sanity/types'

export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

export type GeneralPreviewLayoutKey =
  | 'default'
  | 'card' // deprecated
  | 'media'
  | 'detail'

export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

export type PreviewMediaDimensions = {
  width?: number
  height?: number
  fit?: ImageUrlFitMode
  aspect?: number
  dpr?: number
}

export interface PreviewProps<TLayoutKey = PreviewLayoutKey> {
  actions?: React.ReactNode | React.ComponentType<{layout: TLayoutKey}>
  children?: React.ReactNode
  extendedPreview?: React.ReactNode
  fallbackTitle?: React.ReactNode
  isPlaceholder?: boolean
  mediaDimensions?: PreviewMediaDimensions
  media?:
    | React.ReactNode
    | React.ComponentType<{
        dimensions: PreviewMediaDimensions
        layout: TLayoutKey
      }>
  progress?: number
  status?: React.ReactNode | React.ComponentType<{layout: TLayoutKey}>
  title?: React.ReactNode | React.ComponentType<{layout: TLayoutKey}>
  subtitle?: React.ReactNode | React.ComponentType<{layout: TLayoutKey}>
  description?: React.ReactNode | React.ComponentType<{layout: TLayoutKey}>
  withRadius?: boolean
  withShadow?: boolean
  withBorder?: boolean
  type?: SchemaType
  value?: unknown
  layout?: TLayoutKey
}

export type PreviewComponent = React.ComponentType<PreviewProps>
