import {ArraySchemaType, BooleanSchemaType, NumberSchemaType, StringSchemaType} from '@sanity/types'
import * as React from 'react'
import {ArrayInputProps, BaseInputProps, ObjectInputProps} from './store/formState'
import {ArrayMember, FieldProps, FieldSetProps} from './store/types'
import {PatchEvent} from './patch'

export type RenderFieldCallbackArg = FieldProps & {
  onChange: (event: PatchEvent) => void
  focusRef: React.Ref<any>
}
export type RenderFieldCallback = (renderFieldProps: RenderFieldCallbackArg) => React.ReactNode

export type RenderArrayItemCallback = (
  renderArrayItemProps: RenderArrayItemCallbackArg
) => React.ReactNode

export type RenderArrayItemCallbackArg = ArrayMember & {
  onChange: (event: PatchEvent) => void
  focusRef: React.Ref<any>
}

export type RenderFieldSetCallback = (
  renderFieldSetProps: RenderFieldSetCallbackArg
) => React.ReactNode

export type RenderFieldSetCallbackArg = FieldSetProps & {
  children?: React.ReactNode
}

export interface ObjectInputComponentProps extends ObjectInputProps {
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
