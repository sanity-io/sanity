import {
  ArraySchemaType,
  ObjectField,
  ObjectSchemaType,
  Path,
  SchemaType,
  ValidationMarker,
} from '@sanity/types'
import React from 'react'
import {PatchEvent} from '../patch'
import {PreviewProps} from '../../components/previews'
import {InputProps} from './inputProps'
import {FieldProps} from './fieldProps'
import {ItemProps} from './itemProps'

export type FIXME = any

/**
 * Export `PortableTextMarker` so it can be used to build custom Portable Text markers.
 *
 * @alpha
 */
export type RenderCustomMarkers = (markers: PortableTextMarker[]) => React.ReactNode

/**
 * A generic marker for attaching metadata to specific nodes of the Portable Text input.
 *
 * @alpha
 */
export interface PortableTextMarker {
  type: string
  data?: unknown
  path: Path
}

/**
 * unstable
 * @alpha
 */
export type FormBuilderArrayFunctionComponent = React.ComponentType<
  FormArrayInputFunctionsProps<any, any>
>

/**
 * unstable
 * @alpha
 */
export type FormBuilderCustomMarkersComponent = React.ComponentType<{markers: PortableTextMarker[]}>

/**
 * unstable
 * @alpha
 */
export type FormBuilderMarkersComponent = React.ComponentType<{
  markers: PortableTextMarker[]
  renderCustomMarkers?: RenderCustomMarkers
  validation: ValidationMarker[]
}>

/**
 * @alpha
 */
export type FormBuilderInputComponentMap = Record<
  string,
  {
    field?: React.ComponentType<FieldProps>
    item?: React.ComponentType<ItemProps>
    input?: React.ComponentType<InputProps>
  }
>

/**
 * These are the props an implementation of the ArrayFunctions component will receive
 */
export interface FormArrayInputFunctionsProps<SchemaType extends ArraySchemaType, MemberType> {
  children?: React.ReactNode
  className?: string
  onAppendItem: (itemValue: MemberType) => void
  onChange: (event: PatchEvent) => void
  onCreateValue: (type: SchemaType) => MemberType
  onPrependItem: (itemValue: MemberType) => void
  readOnly?: boolean
  type: SchemaType
  value?: MemberType[]
}

/**
 * @alpha
 */
export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaType, field: ObjectField, selectedLanguageIds: string[]): boolean
}

/**
 * @alpha
 */
export type FormInputComponentResolver = (
  type: SchemaType
) => React.ComponentType<InputProps> | undefined

/**
 * @alpha
 */
export type FormPreviewComponentResolver = (
  type: SchemaType
) => React.ComponentType<PreviewProps<string>> | null | false | undefined
