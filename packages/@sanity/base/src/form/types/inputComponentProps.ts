import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {
  ArrayInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {RenderArrayItemCallback, RenderFieldCallback} from './renderCallback'

export interface ObjectInputComponentProps<
  T = unknown,
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectInputProps<T, S> {
  renderField: RenderFieldCallback
  focusRef: React.Ref<any>
}

export interface ArrayInputComponentProps<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayInputProps<T, S> {
  renderItem: RenderArrayItemCallback
  focusRef: React.Ref<any>
}

export interface StringInputComponentProps<S extends StringSchemaType = StringSchemaType>
  extends StringInputProps<S> {
  focusRef: React.Ref<any>
}
export interface NumberInputComponentProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberInputProps<S> {
  focusRef: React.Ref<any>
}
export interface BooleanInputComponentProps<S extends BooleanSchemaType>
  extends BooleanInputProps<S> {
  focusRef: React.Ref<any>
}
