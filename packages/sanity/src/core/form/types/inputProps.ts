import {
  ArraySchemaType,
  BooleanSchemaType,
  CrossDatasetReferenceValue,
  FileValue,
  GeopointValue,
  ImageValue,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  ReferenceValue,
  SchemaType,
  SlugValue,
  StringSchemaType,
} from '@sanity/types'
import React, {ComponentType, FocusEventHandler, FormEventHandler} from 'react'
import {FormPatch, PatchEvent} from '../patch'
import {
  ArrayOfObjectsFormNode,
  ArrayOfPrimitivesFormNode,
  BooleanFormNode,
  NumberFormNode,
  ObjectFormNode,
  StringFormNode,
} from '../store/types/nodes'

import {UploaderResolver} from '../studio'
import {FormFieldGroup} from '../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderArrayOfPrimitivesItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from './renderCallback'
import {ArrayInputInsertEvent, ArrayInputMoveItemEvent, UploadEvent} from './event'
import {ArrayInputFunctionsProps} from './_transitional'

/** @beta */
export interface BaseInputProps {
  renderDefault: (props: InputProps) => React.ReactElement
}

/** @beta */
export interface ObjectInputProps<
  T = Record<string, any>,
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputProps,
    ObjectFormNode<T, S> {
  /** @beta */
  groups: FormFieldGroup[]

  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onFieldCollapse: (fieldName: string) => void

  /** @beta */
  onFieldExpand: (fieldName: string) => void

  /** @beta */
  onFieldSetCollapse: (fieldSetName: string) => void

  /** @beta */
  onFieldSetExpand: (fieldSetName: string) => void

  /** @beta */
  onFieldGroupSelect: (groupName: string) => void

  /** @beta */
  onPathFocus: (path: Path) => void

  /** @beta */
  onFieldOpen: (fieldName: string) => void

  /** @beta */
  onFieldClose: (fieldName: string) => void

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

/** @beta */
export interface ArrayOfObjectsInputProps<
  T extends {_key: string} = {_key: string},
  S extends ArraySchemaType = ArraySchemaType
> extends BaseInputProps,
    ArrayOfObjectsFormNode<T[], S> {
  /** @beta */
  arrayFunctions?: ComponentType<ArrayInputFunctionsProps<T, S>>

  /** @beta */
  // Data manipulation callbacks special for array inputs
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onItemAppend: (item: T) => void

  /** @beta */
  onItemPrepend: (item: T) => void

  /** @beta */
  onItemRemove: (itemKey: string) => void

  /** @beta */
  onItemMove: (event: ArrayInputMoveItemEvent) => void

  /** @beta */
  onInsert: (event: ArrayInputInsertEvent<T>) => void

  /** @beta */
  resolveInitialValue: (type: SchemaType, params: Record<string, unknown>) => Promise<T>

  /** @beta */
  resolveUploader: UploaderResolver

  /** @beta */
  onUpload: (event: UploadEvent) => void

  /** @beta */
  onPathFocus: (path: Path) => void

  /**
   * for array inputs using expand/collapse semantics for items
   * @beta
   */
  onItemCollapse: (itemKey: string) => void

  /** @beta */
  onItemExpand: (itemKey: string) => void

  /**
   * for array inputs using modal open/close semantics for items
   * @beta
   */
  onItemOpen: (path: Path) => void

  /** @beta */
  onItemClose: () => void

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

/** @beta */
export interface ArrayOfPrimitivesInputProps<
  T extends string | boolean | number = string | boolean | number,
  S extends ArraySchemaType = ArraySchemaType
> extends BaseInputProps,
    ArrayOfPrimitivesFormNode<T[], S> {
  /** @beta */
  arrayFunctions?: ComponentType<ArrayInputFunctionsProps<T, S>>

  // note: not a priority to support collapsible arrays right now
  onSetCollapsed: (collapsed: boolean) => void

  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void

  /** @beta */
  onItemAppend: (item: ArrayOfPrimitivesElementType<T[]>) => void

  /** @beta */
  onItemPrepend: (item: ArrayOfPrimitivesElementType<T[]>) => void

  /** @beta */
  onItemRemove: (index: number) => void

  /** @beta */
  onMoveItem: (event: ArrayInputMoveItemEvent) => void

  /** @beta */
  onInsert: (event: {items: T[]; position: 'before' | 'after'; referenceIndex: number}) => void

  /** @beta */
  resolveUploader: UploaderResolver<NumberSchemaType | BooleanSchemaType | StringSchemaType>

  /** @beta */
  onUpload: (event: UploadEvent) => void

  /** @beta */
  onIndexFocus: (index: number) => void

  /** @beta */
  renderInput: RenderInputCallback

  /** @beta */
  renderItem: RenderArrayOfPrimitivesItemCallback

  /** @beta */
  renderPreview: RenderPreviewCallback

  /** @beta */
  elementProps: ComplexElementProps
}

/** @beta */
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

/** @beta */
export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends BaseInputProps,
    StringFormNode<S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  validationError?: string
  /** @beta */
  elementProps: PrimitiveInputElementProps
}

/** @beta */
export interface NumberInputProps<S extends NumberSchemaType = NumberSchemaType>
  extends BaseInputProps,
    NumberFormNode<S> {
  /** @beta */
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  validationError?: string
  /** @beta */
  elementProps: PrimitiveInputElementProps
}

/** @beta */
export interface BooleanInputProps<S extends BooleanSchemaType = BooleanSchemaType>
  extends BaseInputProps,
    BooleanFormNode<S> {
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

/** @beta */
export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps

/** @beta */
export type InputProps =
  | ObjectInputProps
  | ObjectInputProps<CrossDatasetReferenceValue>
  | ObjectInputProps<FileValue>
  | ObjectInputProps<GeopointValue>
  | ObjectInputProps<ImageValue>
  | ObjectInputProps<ReferenceValue>
  | ObjectInputProps<SlugValue>
  | ArrayOfObjectsInputProps
  | ArrayOfPrimitivesInputProps
  | StringInputProps
  | BooleanInputProps
  | NumberInputProps
