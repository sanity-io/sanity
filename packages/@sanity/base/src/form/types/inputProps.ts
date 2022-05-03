import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'
import * as React from 'react'
import {FormPatch, FormSetPatch, FormUnsetPatch, PatchEvent} from '../patch'

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

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void

  validation: ValidationMarker[]
}

export interface ObjectInputProps<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectNode<T, S>,
    BaseInputProps {
  onChange(patch: FormPatch): void
  onChange(patch: FormPatch[]): void
  onChange(patch: PatchEvent): void

  onSetCollapsed: (collapsed: boolean) => void
  onSetFieldCollapsed: (fieldName: string, collapsed: boolean) => void

  onFocusChildPath: (path: Path) => void
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
  onChange(patch: FormPatch): void
  onChange(patches: FormPatch[]): void

  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  // this opens/close items
  onSetItemCollapsed: (itemKey: string, collapsed: boolean) => void

  onRemoveItem: (key: string) => void
  onInsert: (event: InsertEvent) => void
  // renderItem: RenderItemCallback
}

export interface ArrayOfPrimitivesInputProps<
  T extends (string | boolean | number)[] = (string | boolean | number)[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsNode<T, S>,
    BaseInputProps {
  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  onChange(patch: FormPatch): void
  onChange(patches: FormPatch[]): void

  // this opens/close items
  onSetItemCollapsed: (index: number, collapsed: boolean) => void

  // renderItem: RenderItemCallback
}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringNode<S>,
    BaseInputProps {
  onChange(patch: FormPatch): void
  onChange(patches: FormPatch[]): void
}

export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberNode<S>,
    BaseInputProps {
  onChange(patch: FormSetPatch | FormUnsetPatch): void
}
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanNode<S>,
    BaseInputProps {
  onChange(patch: FormSetPatch | FormUnsetPatch): void
}

export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

export type InputProps =
  | ObjectInputProps
  | ArrayOfObjectsInputProps
  | StringInputProps
  | BooleanInputProps
  | NumberInputProps
