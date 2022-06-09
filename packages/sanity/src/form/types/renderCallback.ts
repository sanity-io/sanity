import {ReactNode} from 'react'
import {SchemaType} from '@sanity/types'
import {PreviewProps} from '../../components/previews'
import {ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

export type RenderArrayOfObjectsItemCallback = (itemProps: ObjectItemProps) => ReactNode
export type RenderArrayOfPrimitivesItemCallback = (itemProps: PrimitiveItemProps) => ReactNode
export type RenderItemCallback = (itemProps: ObjectItemProps | PrimitiveItemProps) => ReactNode

export type RenderFieldCallback<T extends FieldProps = FieldProps> = (fieldProps: T) => ReactNode

export type RenderInputCallback<T extends InputProps = InputProps> = (inputProps: T) => ReactNode

export type RenderPreviewCallback = (props: PreviewProps & {schemaType: SchemaType}) => ReactNode
