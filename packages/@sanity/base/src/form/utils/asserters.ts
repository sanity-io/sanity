// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
import {RenderFieldCallbackArg} from '../types_v3'
import {ArrayFieldProps, ObjectFieldProps} from '../store/types'
import React from 'react'

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
