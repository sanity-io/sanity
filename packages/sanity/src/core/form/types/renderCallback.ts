import React, {ComponentType, CSSProperties, ReactNode} from 'react'
import {SchemaType} from '@sanity/types'
import {PreviewLayoutKey, PreviewMediaDimensions, PreviewProps} from '../../components'
import {ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

/** @beta  */
export type RenderArrayOfObjectsItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'>
) => ReactNode

/** @beta */
export type RenderArrayOfPrimitivesItemCallback = (
  itemProps: Omit<PrimitiveItemProps, 'renderDefault'>
) => ReactNode

/** @beta */
export type RenderItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'> | Omit<PrimitiveItemProps, 'renderDefault'>
) => ReactNode

/** @beta */
export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: Omit<T, 'renderDefault'>
) => ReactNode

/** @beta */
export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: Omit<T, 'renderDefault'>
) => ReactNode

/**
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
  style?: CSSProperties
}

/** @beta */
export type RenderPreviewCallback = (props: RenderPreviewCallbackProps) => ReactNode
