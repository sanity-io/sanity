import {type SchemaType} from '@sanity/types'
import {type ComponentType, type CSSProperties, type ReactNode} from 'react'

import {type PreviewLayoutKey, type PreviewMediaDimensions} from '../../components'
import {type BlockAnnotationProps, type BlockProps} from './blockProps'
import {type FieldProps} from './fieldProps'
import {type InputProps} from './inputProps'
import {type ObjectItemProps, type PrimitiveItemProps} from './itemProps'

/**
 * @hidden
 * @public  */
export type RenderArrayOfObjectsItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export type RenderArrayOfPrimitivesItemCallback = (
  itemProps: Omit<PrimitiveItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'> | Omit<PrimitiveItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderBlockCallback<T extends BlockProps = BlockProps> = (
  blockProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @public */
export type RenderAnnotationCallback<T extends BlockAnnotationProps = BlockAnnotationProps> = (
  annotationProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 *
 * @hidden
 * @public
 */
export interface RenderPreviewCallbackProps<TLayoutKey = PreviewLayoutKey> {
  actions?: ReactNode | ComponentType<{layout: TLayoutKey}>
  children?: ReactNode
  error?: Error | null
  fallbackTitle?: ReactNode
  isPlaceholder?: boolean
  layout?: TLayoutKey
  mediaDimensions?: PreviewMediaDimensions
  progress?: number
  status?: ReactNode | ComponentType<{layout: TLayoutKey}>
  value: unknown
  withBorder?: boolean
  withRadius?: boolean
  withShadow?: boolean
  schemaType: SchemaType
  skipVisibilityCheck?: boolean
  style?: CSSProperties
}

/**
 * @hidden
 * @public */
export type RenderPreviewCallback = (props: RenderPreviewCallbackProps) => ReactNode
