import {ReactNode} from 'react'
import {PreviewProps} from '../../components'
import {ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

/** @public */
export type RenderArrayOfObjectsItemCallback = (itemProps: ObjectItemProps) => ReactNode

/** @public */
export type RenderArrayOfPrimitivesItemCallback = (itemProps: PrimitiveItemProps) => ReactNode

/** @public */
export type RenderItemCallback = (itemProps: ObjectItemProps | PrimitiveItemProps) => ReactNode

/** @public */
export type RenderFieldCallback<T extends FieldProps = FieldProps> = (fieldProps: T) => ReactNode

/** @public */
export type RenderInputCallback<T extends InputProps = InputProps> = (inputProps: T) => ReactNode

/** @beta */
export type RenderPreviewCallback = (props: PreviewProps) => ReactNode
