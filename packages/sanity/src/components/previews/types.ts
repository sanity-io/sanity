import {ImageUrlFitMode} from '@sanity/types'
import {ElementType, ReactNode} from 'react'

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
  actions?: ReactNode | ElementType<{layout: TLayoutKey}>
  children?: ReactNode
  description?: ReactNode | ElementType<{layout: TLayoutKey}>
  error?: Error | null
  fallbackTitle?: ReactNode
  imageUrl?: string
  isPlaceholder?: boolean
  layout?: TLayoutKey
  media?: ReactNode | ElementType<{dimensions: PreviewMediaDimensions; layout: TLayoutKey}>
  mediaDimensions?: PreviewMediaDimensions
  progress?: number
  status?: ReactNode | ElementType<{layout: TLayoutKey}>
  subtitle?: ReactNode | ElementType<{layout: TLayoutKey}>
  title?: ReactNode | ElementType<{layout: TLayoutKey}>
  value?: unknown
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
}

export type PreviewComponent = ElementType<PreviewProps>
