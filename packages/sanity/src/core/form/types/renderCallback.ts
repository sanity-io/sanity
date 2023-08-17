import React, {ComponentType, CSSProperties, ReactNode} from 'react'
import {SchemaType} from '@sanity/types'
import {PreviewLayoutKey, PreviewMediaDimensions, PreviewProps} from '../../components'
import {ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'
import {BlockAnnotationProps, BlockProps} from './blockProps'

/**
 * @hidden
 * @beta  */
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
 * @beta */
export type RenderItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'> | Omit<PrimitiveItemProps, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export type RenderBlockCallback<T extends BlockProps = BlockProps> = (
  blockProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 * @hidden
 * @beta */
export type RenderAnnotationCallback<T extends BlockAnnotationProps = BlockAnnotationProps> = (
  annotationProps: Omit<T, 'renderDefault'>,
) => ReactNode

/**
 *
 * @hidden
 * @beta
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
 * @beta */
export type RenderPreviewCallback = (props: RenderPreviewCallbackProps) => ReactNode
