import {ImageUrlFitMode} from '@sanity/types'

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

export interface PreviewProps<LayoutKey = PreviewLayoutKey> {
  actions?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  children?: React.ReactNode
  extendedPreview?: React.ReactNode
  fallbackTitle?: React.ReactNode
  isPlaceholder?: boolean
  mediaDimensions?: PreviewMediaDimensions
  media?:
    | React.ReactNode
    | React.ComponentType<{
        dimensions: PreviewMediaDimensions
        layout: LayoutKey
      }>
  progress?: number
  status?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  title?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  subtitle?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  description?: React.ReactNode | React.ComponentType<{layout: LayoutKey}>
  withRadius?: boolean
  withShadow?: boolean
}

export type PreviewComponent = React.ComponentType<PreviewProps>
