import {ObjectSchemaType} from '@sanity/types'
import {
  ArrayInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'

interface BaseFieldProps {
  name: string
  index: number
}
export interface StringFieldProps extends StringInputProps, BaseFieldProps {
  kind: 'string'
}

export interface NumberFieldProps extends NumberInputProps, BaseFieldProps {
  kind: 'number'
}

export interface BooleanFieldProps extends BooleanInputProps, BaseFieldProps {
  kind: 'boolean'
}
export interface ObjectFieldProps<T = unknown, S extends ObjectSchemaType = ObjectSchemaType>
  extends ObjectInputProps<T, S>,
    BaseFieldProps {
  kind: 'object'
}

/**
 * Represents an object field of an array type
 */
export interface ArrayFieldProps extends ArrayInputProps, BaseFieldProps {
  kind: 'array'
}

export type FieldProps =
  | StringFieldProps
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
