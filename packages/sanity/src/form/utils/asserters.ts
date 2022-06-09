// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function

import {isArraySchemaType, isBooleanSchemaType, isObjectSchemaType} from '@sanity/types'
import {ArrayOfObjectsInputProps, InputProps, ObjectInputProps} from '../types'
import {
  BooleanFieldProps,
  FieldProps,
  ObjectFieldProps,
  PrimitiveFieldProps,
} from '../types/fieldProps'

export function assertType<T>(v: unknown): asserts v is T {}

export function isObjectInputProps(inputProps: InputProps): inputProps is ObjectInputProps {
  return isObjectSchemaType(inputProps.schemaType)
}

export function isArrayInputProps(inputProps: InputProps): inputProps is ArrayOfObjectsInputProps {
  return isArraySchemaType(inputProps.schemaType)
}

export function isPrimitiveField(fieldProps: FieldProps): fieldProps is PrimitiveFieldProps {
  return !isObjectSchemaType(fieldProps.schemaType) && !isArraySchemaType(fieldProps.schemaType)
}

export function isBooleanField(fieldProps: FieldProps): fieldProps is BooleanFieldProps {
  return isBooleanSchemaType(fieldProps.schemaType)
}

export function isObjectField(fieldProps: FieldProps): fieldProps is ObjectFieldProps {
  return isObjectSchemaType(fieldProps.schemaType)
}
