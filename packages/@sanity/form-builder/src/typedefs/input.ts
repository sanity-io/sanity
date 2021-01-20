import {FormFieldPresence} from '@sanity/base/presence'
import {
  ArraySchemaType,
  BooleanSchemaType,
  Marker,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import PatchEvent from '../PatchEvent'

export type InputComponentProps<
  Value = unknown,
  Type = Value extends Array<unknown>
    ? ArraySchemaType
    : Value extends boolean
    ? BooleanSchemaType
    : Value extends string
    ? StringSchemaType
    : Value extends number
    ? NumberSchemaType
    : Value extends Record<string, unknown>
    ? ObjectSchemaType
    : SchemaType
> = {
  compareValue?: Value
  filterField: (type: unknown, field: unknown) => boolean
  isRoot?: boolean
  level: number
  markers: Marker[]
  onChange: (patchEvent: PatchEvent) => void
  onFocus: (focusArg?: Path | React.SyntheticEvent | Event) => void
  onBlur: () => void
  presence: FormFieldPresence[]
  readOnly: boolean
  type: Type
  value?: Value
}

export type InputComponent<
  Value = unknown,
  Type = Value extends Array<unknown>
    ? ArraySchemaType
    : Value extends boolean
    ? BooleanSchemaType
    : Value extends string
    ? StringSchemaType
    : Value extends number
    ? NumberSchemaType
    : Value extends Record<string, unknown>
    ? ObjectSchemaType
    : SchemaType
> = React.ComponentType<InputComponentProps<Value, Type>>
