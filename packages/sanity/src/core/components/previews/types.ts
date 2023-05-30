import {ImageUrlFitMode, SchemaType} from '@sanity/types'
import React, {ComponentType, ReactNode} from 'react'

/**
 * @hidden
 * @beta */
export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

/**
 * @hidden
 * @beta */
export type GeneralPreviewLayoutKey = 'default' | 'media' | 'detail'

/**
 * @hidden
 * @beta */
export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

/**
 * @hidden
 * @beta */
export type PreviewMediaDimensions = {
  aspect?: number
  dpr?: number
  fit?: ImageUrlFitMode
  height?: number
  width?: number
}

/**
 *
 * @hidden
 * @beta
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
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
  schemaType?: SchemaType
  renderDefault: (props: PreviewProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
export type PreviewComponent = ComponentType<PreviewProps>
