import {ImageUrlFitMode} from '@sanity/types'
import {ComponentType, ReactNode} from 'react'

export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

export type GeneralPreviewLayoutKey = 'default' | 'media' | 'detail'

export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

export type PreviewMediaDimensions = {
  aspect?: number
  dpr?: number
  fit?: ImageUrlFitMode
  height?: number
  width?: number
}

/**
 * @alpha
 */
export interface PreviewProps<TLayoutKey = PreviewLayoutKey> {
  actions?: ReactNode | ComponentType<{layout: TLayoutKey}>
  children?: ReactNode
  description?: ReactNode | ComponentType<{layout: TLayoutKey}>
  error?: Error | null
  fallbackTitle?: ReactNode
  imageUrl?: string
  isPlaceholder?: boolean
  layout?: TLayoutKey
  media?: ReactNode | ComponentType<{dimensions: PreviewMediaDimensions; layout: TLayoutKey}>
  mediaDimensions?: PreviewMediaDimensions
  progress?: number
  status?: ReactNode | ComponentType<{layout: TLayoutKey}>
  subtitle?: ReactNode | ComponentType<{layout: TLayoutKey}>
  title?: ReactNode | ComponentType<{layout: TLayoutKey}>
  value?: unknown
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
}

export type PreviewComponent = ComponentType<PreviewProps>
