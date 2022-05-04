import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
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
import {FieldPresence} from '../store/formState'
import {RenderFieldCallback, RenderInputCallback, RenderItemCallback} from './renderCallback'
import {InsertItemEvent, MoveItemEvent} from './event'
import {FieldGroup} from './fieldGroups'

// these are the props shared by *all* inputs
export interface BaseInputProps {
  focusRef: React.Ref<any>

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void

  validation: ValidationMarker[]
  presence: FieldPresence[]
}

export interface ObjectInputProps<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectNode<T, S>,
    BaseInputProps {
  groups: FieldGroup[]

  // todo: consider remove PatchEvent
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  onSetCollapsed: (collapsed: boolean) => void
  onSetFieldCollapsed: (fieldName: string, collapsed: boolean) => void
  onSetFieldSetCollapsed: (fieldsetName: string, collapsed: boolean) => void

  onFocusPath: (path: Path) => void
  onSelectFieldGroup: (groupName: string) => void

  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderItemCallback
}

export interface ArrayOfObjectsInputProps<
  T extends {_key: string} = {_key: string},
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsNode<T[], S>,
    BaseInputProps {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  onAppendItem: (item: T) => void
  onPrependItem: (item: T) => void
  onRemoveItem: (itemKey: string) => void
  onMoveItem: (event: MoveItemEvent) => void
  onInsert: (event: InsertItemEvent) => void

  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  onFocusPath: (path: Path) => void

  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  // this opens/close items
  onSetItemCollapsed: (itemKey: string, collapsed: boolean) => void

  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderField: RenderFieldCallback
}

export interface ArrayOfPrimitivesInputProps<
  T extends (string | boolean | number)[] = (string | boolean | number)[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsNode<T, S>,
    BaseInputProps {
  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  // this opens/close items
  onSetItemCollapsed: (index: number, collapsed: boolean) => void

  onAppendItem: (item: T) => void
  onPrependItem: (item: T) => void
  onRemoveItem: (itemKey: string) => void
  onMoveItem: (event: MoveItemEvent) => void
  onInsert: (event: InsertItemEvent) => void

  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  onFocusPath: (path: Path) => void

  renderInput: RenderInputCallback
  renderItem: RenderItemCallback
  renderField: RenderFieldCallback
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
