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
import {FormPatch, PatchEvent} from '../patch'

import {
  ArrayOfObjectsFormNode,
  ArrayOfPrimitivesFormNode,
  BooleanFormNode,
  NumberFormNode,
  ObjectFormNode,
  StringFormNode,
} from '../store/types/nodes'
import {FormFieldPresence} from '../../presence'
import {
  RenderArrayOfObjectsItemCallback,
  RenderArrayOfPrimitivesItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from './renderCallback'
import {InsertItemEvent, MoveItemEvent} from './event'
import {FormFieldGroup} from './fieldGroups'

// these are the props shared by *all* inputs
export interface BaseInputProps {
  focusRef: React.Ref<any>

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void

  validation: ValidationMarker[]
  presence: FormFieldPresence[]
}

export interface ObjectInputProps<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectFormNode<T, S>,
    BaseInputProps {
  groups: FormFieldGroup[]

  // todo: consider remove PatchEvent
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  collapsed: boolean | undefined
  onCollapse: () => void
  onExpand: () => void
  onCollapseField: (fieldName: string) => void
  onExpandField: (fieldName: string) => void

  onCollapseFieldSet: (fieldSetName: string) => void
  onExpandFieldSet: (fieldSetName: string) => void

  onSelectFieldGroup: (groupName: string) => void

  onFocusPath: (path: Path) => void

  // for object inputs using modal open/close semantics for fields
  onOpenField: (fieldName: string) => void
  onCloseField: (fieldName: string) => void

  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
}

export interface ArrayOfObjectsInputProps<
  T extends {_key: string} = {_key: string},
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsFormNode<T[], S>,
    BaseInputProps {
  // Data manipulation callbacks special for array inputs
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  onAppendItem: (item: T) => void
  onPrependItem: (item: T) => void
  onRemoveItem: (itemKey: string) => void
  onMoveItem: (event: MoveItemEvent) => void
  onInsert: (event: InsertItemEvent) => void

  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  onFocusPath: (path: Path) => void

  // note: not a priority to support collapsible arrays right now
  onCollapse: () => void
  onExpand: () => void

  // for array inputs using expand/collapse semantics for items
  onCollapseItem: (itemKey: string) => void
  onExpandItem: (itemKey: string) => void

  // for array inputs using modal open/close semantics for items
  onOpenItem: (itemKey: string) => void
  onCloseItem: (itemKey: string) => void

  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderField: RenderFieldCallback
}

export type ArrayOfPrimitivesElementType<T extends any[]> = T extends (infer K)[] ? K : unknown

export interface ArrayOfPrimitivesInputProps<
  T extends (string | boolean | number)[] = (string | boolean | number)[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfPrimitivesFormNode<T, S>,
    BaseInputProps {
  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  onAppendItem: (item: ArrayOfPrimitivesElementType<T>) => void
  onPrependItem: (item: ArrayOfPrimitivesElementType<T>) => void
  onRemoveItem: (index: number) => void
  onMoveItem: (event: MoveItemEvent) => void
  onInsert: (event: {items: T; position: 'before' | 'after'; referenceIndex: number}) => void

  onFocusIndex: (index: number) => void

  renderInput: RenderInputCallback
  renderItem: RenderArrayOfPrimitivesItemCallback
}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringFormNode<S>,
    BaseInputProps {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  customValidity?: string
}

export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberFormNode<S>,
    BaseInputProps {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  customValidity?: string
}
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanFormNode<S>,
    BaseInputProps {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  customValidity?: string
}

export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

export type InputProps =
  | ObjectInputProps
  | ArrayOfObjectsInputProps
  | ArrayOfPrimitivesInputProps
  | StringInputProps
  | BooleanInputProps
  | NumberInputProps
