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
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent from '../PatchEvent'

export type Props<
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
  type: S
  level: number
  value: T | null | undefined
  readOnly?: boolean | null
  onChange: (patchEvent: PatchEvent) => void
  // Note: we should allow implementors of custom inputs to forward the passed onFocus to native element's onFocus handler,
  // but use Path consistently on internal inputs
  onFocus: (path?: Path | React.FocusEvent<any>) => void
  onBlur?: () => void
  markers: Marker[]
  presence: FormFieldPresence[]
}
