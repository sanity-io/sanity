import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {
  ArrayInputState,
  BooleanInputState,
  NumberInputState,
  ObjectInputState,
  StringInputState,
} from './inputState'
import {RenderArrayItemCallback, RenderFieldCallback} from './renderCallback'

export interface ObjectInputProps<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectInputState<T, S> {
  renderField: RenderFieldCallback
  focusRef: React.Ref<any>
}

export interface ArrayInputProps<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayInputState<T, S> {
  renderItem: RenderArrayItemCallback
  focusRef: React.Ref<any>
}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringInputState<S> {
  focusRef: React.Ref<any>
}
export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberInputState<S> {
  focusRef: React.Ref<any>
}
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanInputState<S> {
  focusRef: React.Ref<any>
}
