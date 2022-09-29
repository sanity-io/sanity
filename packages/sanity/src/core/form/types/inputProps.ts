import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React, {FocusEventHandler, FormEventHandler} from 'react'
import {FormPatch, PatchEvent} from '../patch'
import {
  ArrayOfObjectsFormNode,
  ArrayOfPrimitivesFormNode,
  BooleanFormNode,
  NumberFormNode,
  ObjectFormNode,
  StringFormNode,
} from '../store/types/nodes'
import {FormFieldGroup} from '../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderArrayOfPrimitivesItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from './renderCallback'
import {InsertItemEvent, MoveItemEvent} from './event'

/** @public */
export interface ObjectInputProps<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectFormNode<T, S> {
  /** @beta */
  groups: FormFieldGroup[]

  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onCollapseField: (fieldName: string) => void

  /** @beta */
  onExpandField: (fieldName: string) => void

  /** @beta */
  onCollapseFieldSet: (fieldSetName: string) => void

  /** @beta */
  onExpandFieldSet: (fieldSetName: string) => void

  /** @beta */
  onFieldGroupSelect: (groupName: string) => void

  /** @beta */
  onFocusPath: (path: Path) => void

  /** @beta */
  onOpenField: (fieldName: string) => void

  /** @beta */
  onCloseField: (fieldName: string) => void

  /** @beta */
  renderInput: RenderInputCallback

  /** @beta */
  renderField: RenderFieldCallback

  /** @beta */
  renderItem: RenderArrayOfObjectsItemCallback

  /** @beta */
  renderPreview: RenderPreviewCallback

  /** @beta */
  elementProps: ComplexElementProps
}

/** @public */
export interface ArrayOfObjectsInputProps<
  T extends {_key: string} = {_key: string},
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfObjectsFormNode<T[], S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onAppendItem: (item: T) => void

  /** @beta */
  onPrependItem: (item: T) => void

  /** @beta */
  onRemoveItem: (itemKey: string) => void

  /** @beta */
  onMoveItem: (event: MoveItemEvent) => void

  /** @beta */
  onInsert: (event: InsertItemEvent) => void

  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  onFocusPath: (path: Path) => void

  /**
   * NOTE: not a priority to support collapsible arrays right now
   * @beta
   */
  onCollapse: () => void

  /** @beta */
  onExpand: () => void

  /**
   * for array inputs using expand/collapse semantics for items
   * @beta
   */
  onCollapseItem: (itemKey: string) => void

  /** @beta */
  onExpandItem: (itemKey: string) => void

  /**
   * for array inputs using modal open/close semantics for items
   * @beta
   */
  onOpenItem: (path: Path) => void

  /** @beta */
  onCloseItem: () => void

  /** @beta */
  renderField: RenderFieldCallback

  /** @beta */
  renderInput: RenderInputCallback

  /** @beta */
  renderItem: RenderArrayOfObjectsItemCallback

  /** @beta */
  renderPreview: RenderPreviewCallback

  /** @beta */
  elementProps: ComplexElementProps
}

/** @beta */
export type ArrayOfPrimitivesElementType<T extends any[]> = T extends (infer K)[] ? K : unknown

/** @public */
export interface ArrayOfPrimitivesInputProps<
  T extends (string | boolean | number)[] = (string | boolean | number)[],
  S extends ArraySchemaType = ArraySchemaType
> extends ArrayOfPrimitivesFormNode<T, S> {
  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onAppendItem: (item: ArrayOfPrimitivesElementType<T>) => void

  /** @beta */
  onPrependItem: (item: ArrayOfPrimitivesElementType<T>) => void

  /** @beta */
  onRemoveItem: (index: number) => void

  /** @beta */
  onMoveItem: (event: MoveItemEvent) => void

  /** @beta */
  onInsert: (event: {items: T; position: 'before' | 'after'; referenceIndex: number}) => void

  /** @beta */
  onFocusIndex: (index: number) => void

  /** @beta */
  renderInput: RenderInputCallback

  /** @beta */
  renderItem: RenderArrayOfPrimitivesItemCallback

  /** @beta */
  renderPreview: RenderPreviewCallback

  /** @beta */
  elementProps: ComplexElementProps
}

/** @public */
export interface PrimitiveInputElementProps {
  value?: string
  id: string
  readOnly: boolean
  placeholder?: string
  onChange: FormEventHandler
  onFocus: FocusEventHandler
  onBlur: FocusEventHandler
  ref: React.MutableRefObject<any>
}

/** @beta */
export interface ComplexElementProps {
  id: string
  onFocus: FocusEventHandler
  onBlur: FocusEventHandler
  ref: React.MutableRefObject<any>
}

/** @public */
export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends StringFormNode<S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  validationError?: string
  /** @beta */
  elementProps: PrimitiveInputElementProps
}

/** @public */
export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends NumberFormNode<S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  validationError?: string
  /** @beta */
  elementProps: PrimitiveInputElementProps
}

/** @public */
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BooleanFormNode<S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /**
   * A shorthand aggregation of any validation errors the input currently have
   * Will be falsey if no error.
   * In the case of multiple errors it will be a newline delimited string of each error message
   * For advanced use cases use the ´validation´ prop which contains more levels and details
   */
  validationError?: string
  /** @beta */
  elementProps: PrimitiveInputElementProps
}

/** @internal */
export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

/** @public */
export type InputProps =
  | ObjectInputProps
  | ArrayOfObjectsInputProps
  | ArrayOfPrimitivesInputProps
  | StringInputProps
  | BooleanInputProps
  | NumberInputProps
