import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {ArrayInputProps, BaseInputProps, ObjectInputProps} from '../store/formState'
import {FieldProps, FieldSetProps} from '../types'

export type RenderFieldCallbackArg = FieldProps & {
  focusRef: React.Ref<any>
}
export type RenderFieldCallback = (renderFieldProps: RenderFieldCallbackArg) => React.ReactNode

export type RenderArrayItemCallback = (
  renderArrayItemProps: RenderArrayItemCallbackArg
) => React.ReactNode

export type RenderArrayItemCallbackArg = ObjectInputProps & {
  focusRef: React.Ref<any>
}

export type RenderFieldSetCallback = (
  renderFieldSetProps: RenderFieldSetCallbackArg
) => React.ReactNode

export type RenderFieldSetCallbackArg = FieldSetProps & {
  children?: React.ReactNode
}

export interface ObjectInputComponentProps<
  T extends Record<string, unknown> = Record<string, unknown>,
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectInputProps<T, S> {
  renderField: RenderFieldCallback
  focusRef: React.Ref<any>
}

export interface ArrayInputComponentProps<V = unknown[]>
  extends ArrayInputProps<ArraySchemaType, V> {
  renderItem: RenderArrayItemCallback
  focusRef: React.Ref<any>
}

export interface StringInputComponentProps<S extends StringSchemaType = StringSchemaType>
  extends BaseInputProps<S, string> {
  focusRef: React.Ref<any>
}
export interface NumberInputComponentProps extends BaseInputProps<NumberSchemaType, number> {
  focusRef: React.Ref<any>
}
export interface BooleanInputComponentProps extends BaseInputProps<BooleanSchemaType, boolean> {
  focusRef: React.Ref<any>
}

export type InputComponentProps =
  | ObjectInputComponentProps
  | ArrayInputComponentProps
  | StringInputComponentProps
  | NumberInputComponentProps
  | BooleanInputComponentProps
