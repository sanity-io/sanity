import type {ImageUrlFitMode, SchemaType} from '@sanity/types'
import type {ComponentType, ReactNode, ReactElement} from 'react'

/**
 * Type for portable text preview layout key
 *
 * @public
 */
export type PortableTextPreviewLayoutKey = 'block' | 'blockImage' | 'inline'

/**
 * Type for generic preview layout key
 *
 * @public
 */
export type GeneralPreviewLayoutKey = 'default' | 'media' | 'detail'

/**
 * Type for preview layout key. See also {@link GeneralPreviewLayoutKey} and {@link PortableTextPreviewLayoutKey}
 *
 * @public
 */
export type PreviewLayoutKey = GeneralPreviewLayoutKey | PortableTextPreviewLayoutKey

/**
 * @hidden
 * @beta
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
  renderDefault: (props: PreviewProps) => ReactElement
}

/**
 * @hidden
 * @beta
 */
export type PreviewComponent = ComponentType<PreviewProps>
