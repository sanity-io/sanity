import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {PatchEvent} from '../patch'

import {RenderArrayItemCallback, RenderFieldCallback} from './renderCallback'
import {InsertEvent} from './event'

// these are the props shared by *all* inputs
export interface BaseInputProps {
  focusRef: React.Ref<any>

  onChange: (patchEvent: PatchEvent) => void

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void
}

export interface ObjectInputProps<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectInputState<T, S>,
    BaseInputProps {
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  onSetFieldsetCollapsed: (fieldsetName: string) => void

  renderField: RenderFieldCallback
}

export interface ArrayInputProps<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsInputState<T, S>,
    BaseInputProps {
  renderItem: RenderArrayItemCallback
  onInsert: (event: InsertEvent) => void
  onRemove: (key: InsertEvent) => void
}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringInputState<S>,
    BaseInputProps {}
export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberInputState<S>,
    BaseInputProps {}
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanInputState<S>,
    BaseInputProps {}

export type InputProps = ObjectInputProps | StringInputProps | ArrayInputProps | BooleanInputProps
