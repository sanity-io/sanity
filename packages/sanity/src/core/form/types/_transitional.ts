import {
  ArraySchemaType,
  FormNodeValidation,
  ObjectField,
  ObjectSchemaType,
  Path,
} from '@sanity/types'
import React from 'react'
import {PatchEvent} from '../patch'
import {PreviewProps} from '../../components'
import {InputProps} from './inputProps'
import {FieldProps} from './fieldProps'
import {ItemProps} from './itemProps'

/**
 * Export `PortableTextMarker` so it can be used to build custom Portable Text markers.
 *
 * @beta
 */
export type RenderCustomMarkers = (markers: PortableTextMarker[]) => React.ReactNode

/**
 * A generic marker for attaching metadata to specific nodes of the Portable Text input.
 *
 * @beta
 */
export interface PortableTextMarker {
  type: string
  data?: unknown
  path: Path
}

/**
 * @beta
 */
export type FormBuilderArrayFunctionComponent = React.ComponentType<
  ArrayInputFunctionsProps<unknown, ArraySchemaType>
>

/**
 * @beta
 */
export type FormBuilderCustomMarkersComponent = React.ComponentType<{markers: PortableTextMarker[]}>

/**
 * @beta
 */
export type FormBuilderMarkersComponent = React.ComponentType<{
  markers: PortableTextMarker[]
  renderCustomMarkers?: RenderCustomMarkers
  validation: FormNodeValidation[]
}>

/**
 * @beta
 */
export type FormBuilderInputComponentMap = Record<
  string,
  {
    field?: React.ComponentType<FieldProps>
    item?: React.ComponentType<ItemProps>
    input?: React.ComponentType<InputProps>
    preview?: React.ComponentType<PreviewProps>
  }
>

/**
 * These are the props an implementation of the ArrayFunctions component will receive
 *
 * @beta
 */
export interface ArrayInputFunctionsProps<Item, SchemaType extends ArraySchemaType> {
  children?: React.ReactNode
  onItemAppend: (itemValue: Item) => void
  onChange: (event: PatchEvent) => void
  onValueCreate: (type: SchemaType) => Item
  onItemPrepend: (itemValue: Item) => void
  readOnly?: boolean
  schemaType: SchemaType
  value?: Item[]
}

/**
 * @internal
 */
export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaType, field: ObjectField, selectedLanguageIds: string[]): boolean
}
