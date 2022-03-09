import {FormFieldPresence} from '@sanity/base/presence'
import {
  ArraySchemaType,
  BooleanSchemaType,
  Marker,
  NumberSchemaType,
  ObjectField,
  ObjectSchemaType,
  ObjectSchemaTypeWithOptions,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import PatchEvent from './PatchEvent'

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
  compareValue: T | null | undefined
  focusPath: Path
  level: number
  markers: Marker[]
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
  value: T | null | undefined
}
