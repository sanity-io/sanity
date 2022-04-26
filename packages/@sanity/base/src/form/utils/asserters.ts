// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
import React from 'react'
import {ArrayFieldProps, FieldProps, ObjectFieldProps} from '../types'

export function assertType<T>(v: unknown): asserts v is T {
  //
}

export function isObjectField(
  field: FieldProps
): field is ObjectFieldProps & {focusRef: React.Ref<any>} {
  return field.kind === 'object'
}

export function isArrayField(
  field: FieldProps
): field is ArrayFieldProps & {focusRef: React.Ref<any>} {
  return field.kind === 'array'
}
