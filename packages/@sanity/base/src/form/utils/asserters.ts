// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
import React from 'react'
import {ArrayFieldProps, ObjectFieldProps, RenderFieldCallbackArg} from '../types'

export function assertType<T>(v: unknown): asserts v is T {}

export function isObjectField(
  field: RenderFieldCallbackArg
): field is ObjectFieldProps & {focusRef: React.Ref<any>} {
  return field.kind === 'object'
}

export function isArrayField(
  field: RenderFieldCallbackArg
): field is ArrayFieldProps & {focusRef: React.Ref<any>} {
  return field.kind === 'array'
}
