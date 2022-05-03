import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {PatchEvent} from '../patch'

import {
  ArrayOfObjectsNode,
  BooleanNode,
  NumberNode,
  ObjectNode,
  StringNode,
} from '../store/types/nodes'
import {RenderFieldCallback, RenderInputCallback, RenderItemCallback} from './renderCallback'
import {InsertEvent} from './event'

// these are the props shared by *all* inputs
export interface BaseInputProps {
  focusRef: React.Ref<any>

  onChange: (patchEvent: PatchEvent) => void

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void
}

export interface ObjectInputProps<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectNode<T, S>,
    BaseInputProps {
  onSetCollapsed: (collapsed: boolean) => void
  onSetFieldCollapsed: (fieldName: string, collapsed: boolean) => void

  onSelectFieldGroup: (groupName: string) => void
  onSetFieldSetCollapsed: (fieldsetName: string, collapsed: boolean) => void

  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
}

export interface ArrayOfObjectsInputProps<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsNode<T, S>,
    BaseInputProps {
  // note: not a priority to support collapsible arrays
  onSetCollapsed: (collapsed: boolean) => void

  // this opens/close items
  onSetItemCollapsed: (itemKey: string, collapsed: boolean) => void

  onRemoveItem: (key: string) => void
  onInsert: (event: InsertEvent) => void
  // renderItem: RenderItemCallback
}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringNode<S>,
    BaseInputProps {}

export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberNode<S>,
    BaseInputProps {}
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanNode<S>,
    BaseInputProps {}

export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

export type InputProps =
  | ObjectInputProps
  | ArrayOfObjectsInputProps
  | StringInputProps
  | BooleanInputProps
  | NumberInputProps
