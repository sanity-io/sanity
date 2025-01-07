import {type ImageUrlFitMode, type SchemaType} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'

/**
 * Portable text preview layout key
 *
 * @public
 */
export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

/**
 * General preview layout key
 *
 * @public
 */
export type GeneralPreviewLayoutKey = 'compact' | 'default' | 'media' | 'detail'

/**
 * General Document list layout key
 *
 * @hidden
 * @beta
 */
export type GeneralDocumentListLayoutKey = GeneralPreviewLayoutKey | 'sheetList'

/**
 * Preview layout key. See also {@link GeneralPreviewLayoutKey} and {@link PortableTextPreviewLayoutKey}
 *
 * @public
 */
export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

/**
 * @hidden
 * @public
 */
export interface PreviewMediaDimensions {
  aspect?: number
  dpr?: number
  fit?: ImageUrlFitMode
  height?: number
  width?: number
}

/**
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
  renderDefault: (props: PreviewProps) => React.JSX.Element
}

/**
 * @hidden
 * @beta
 */
export type PreviewComponent = ComponentType<PreviewProps>
