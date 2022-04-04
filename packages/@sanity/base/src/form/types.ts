import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectField,
  ObjectSchemaType,
  ObjectSchemaTypeWithOptions,
  Path,
  SchemaType,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'
import {FormFieldPresence} from '../presence'
import {PatchEvent} from './patch'

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
 * @alpha
 */
export type FormBuilderArrayFunctionComponent = React.ComponentType<
  FormArrayInputFunctionsProps<any, any>
>

/**
 * @alpha
 */
export type FormBuilderCustomMarkersComponent = React.ComponentType<{markers: PortableTextMarker[]}>

/**
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
  React.ComponentType<FormInputProps<any, any>> | undefined
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
  onFocusItem: (item: MemberType, index: number) => void
  onPrependItem: (itemValue: MemberType) => void
  readOnly?: boolean
  type: SchemaType
  value?: MemberType[]
}

/**
 * @alpha
 */
export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaTypeWithOptions, field: ObjectField, selectedLanguageIds: string[]): boolean
}

/**
 * @alpha
 */
export type FormInputProps<
  T = any,
  S = T extends Array<any>
    ? ArraySchemaType
    : T extends boolean
    ? BooleanSchemaType
    : T extends string
    ? StringSchemaType
    : T extends number
    ? NumberSchemaType
    : T extends Record<string, any>
    ? ObjectSchemaType
    : SchemaType
> = {
  compareValue?: T
  focusPath?: Path
  level: number
  validation: ValidationMarker[]
  onBlur?: () => void
  // @todo allow implementers to pass a native DOM ChangeEvent
  // @todo allow implementers to pass an array of patch objects
  // @todo allow implementers to simply pass the new value
  // @todo deprecate `PatchEvent`
  onChange: (event: PatchEvent) => void
  // NOTE: we should allow implementers of custom inputs to forward the passed onFocus to native
  // element's onFocus handler, but use Path consistently on internal inputs
  onFocus: (pathOrEvent?: Path | React.FocusEvent<any>) => void
  presence: FormFieldPresence[]
  // @todo: should the `readOnly` use the `ConditionalProperty` type?
  // readOnly?: ConditionalProperty
  readOnly?: boolean
  type: S
  value?: T
}

/**
 * @alpha
 */
export type FormInputComponentResolver = (
  type: SchemaType
) => React.ComponentType<FormInputProps<any, any>> | null | false | undefined

/**
 * @alpha
 */
export interface FormPreviewProps {
  actions?: React.ReactNode
  fallbackTitle?: React.ReactNode
  layout?: string
  type: SchemaType
  value?: Array<unknown> | Record<string, unknown> | number | boolean | string
  withBorder?: boolean
  withRadius?: boolean
}

/**
 * @alpha
 */
export type FormPreviewComponentResolver = (
  type: SchemaType
) => React.ComponentType<FormPreviewProps> | null | false | undefined
