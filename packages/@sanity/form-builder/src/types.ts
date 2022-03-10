import {FormFieldPresence} from '@sanity/base/presence'
import {
  ArraySchemaType,
  BooleanSchemaType,
  ValidationMarker,
  NumberSchemaType,
  ObjectField,
  ObjectSchemaType,
  ObjectSchemaTypeWithOptions,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {PatchEvent} from './PatchEvent'

/**
 * These are the props an implementation of the ArrayFunctions component will receive
 */
export interface FormArrayInputFunctionsProps<SchemaType extends ArraySchemaType, MemberType> {
  className?: string
  type: SchemaType
  children?: React.ReactNode
  value?: MemberType[]
  readOnly: boolean | null
  onAppendItem: (itemValue: MemberType) => void
  onPrependItem: (itemValue: MemberType) => void
  onFocusItem: (item: MemberType, index: number) => void
  onCreateValue: (type: SchemaType) => MemberType
  onChange: (event: PatchEvent) => void
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
  compareValue?: T | null
  focusPath: Path
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
  value?: T | null
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
  layout?: string
  value?: Array<unknown> | Record<string, unknown> | number | boolean | string
  type: SchemaType
  fallbackTitle?: React.ReactNode
  withRadius?: boolean
  withBorder?: boolean
}

/**
 * @alpha
 */
export type FormPreviewComponentResolver = (
  type: SchemaType
) => React.ComponentType<FormPreviewProps> | null | false | undefined
