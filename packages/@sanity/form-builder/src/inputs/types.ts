import {
  ArraySchemaType,
  BooleanSchemaType,
  Marker,
  NumberSchemaType,
  ObjectSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent from '../PatchEvent'

export type Props<
  T,
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
  readOnly: boolean | null
  onChange: (patchEvent: PatchEvent) => void
  onFocus: () => void
  onBlur?: () => void
  markers: Marker[]
  presence: FormFieldPresence[]
}
