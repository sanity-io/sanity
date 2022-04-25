import {StringSchemaType} from '@sanity/types'
import * as React from 'react'
import {
  ArrayInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {RenderArrayItemCallback, RenderFieldCallback} from './renderCallback'

export interface ObjectInputComponentProps extends ObjectInputProps {
  renderField: RenderFieldCallback
  focusRef: React.Ref<any>
}

export interface ArrayInputComponentProps<V = unknown[]> extends ArrayInputProps {
  renderItem: RenderArrayItemCallback
  focusRef: React.Ref<any>
}

export interface StringInputComponentProps<S extends StringSchemaType = StringSchemaType>
  extends StringInputProps {
  focusRef: React.Ref<any>
}
export interface NumberInputComponentProps extends NumberInputProps {
  focusRef: React.Ref<any>
}
export interface BooleanInputComponentProps extends BooleanInputProps {
  focusRef: React.Ref<any>
}
