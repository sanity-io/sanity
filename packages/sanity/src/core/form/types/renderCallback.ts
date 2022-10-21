import {ReactNode} from 'react'
import {PreviewProps} from '../../components'
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

/** @beta */
export type RenderPreviewCallback = (props: Omit<PreviewProps, 'renderDefault'>) => ReactNode
