import {
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import {BooleanInputProps, NumberInputProps, ObjectInputProps, StringInputProps} from './inputProps'

export interface ArrayOfPrimitivesItem<
  T extends BooleanSchemaType | StringSchemaType | NumberSchemaType
> {
  key: string
  type: T
  index: number
  inputProps: StringInputProps | BooleanInputProps | NumberInputProps
}

export interface ArrayOfObjectsItem<T extends ObjectSchemaType> {
  key: string
  type: T
  index: number
  inputProps: ObjectInputProps<T> & {value: ObjectInputProps<T>['value'] & {_key: string}}
}
