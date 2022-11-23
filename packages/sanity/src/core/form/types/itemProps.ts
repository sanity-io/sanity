import {
  ArraySchemaType,
  BooleanSchemaType,
  CrossDatasetReferenceValue,
  FileValue,
  FormNodeValidation,
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
import React from 'react'
import {FormNodePresence} from '../../presence'
import {ObjectInputProps} from './inputProps'
import {ArrayInputInsertEvent} from './event'

/** @public */
export type ObjectItem = {
  _type?: string
  _key: string
}

/** @public */
export interface BaseItemProps<T> {
  schemaType: SchemaType
  key: string
  index: number
  level: number
  value: unknown
  path: Path
  title: string | undefined
  description: string | undefined
  inputId: string
  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void
  readOnly?: boolean
  focused?: boolean
  onRemove: () => void

  // --- todo, potentially
  // onMoveTo: (event: {ref: number|string, position: 'before'|'after'}) => void
  // onDuplicate: () => void
  // ---
  /** @beta */
  onInsert: (event: Omit<ArrayInputInsertEvent<T>, 'referenceItem'>) => void

  children: React.ReactNode

  validation: FormNodeValidation[]

  /** @beta */
  presence: FormNodePresence[]

  renderDefault: (props: ItemProps) => React.ReactElement
}

/** @public */
export interface ObjectItemProps<Item extends ObjectItem = ObjectItem> extends BaseItemProps<Item> {
  changed: boolean
  schemaType: ObjectSchemaType
  parentSchemaType: ArraySchemaType
  collapsed: boolean | undefined
  collapsible: boolean | undefined
  onCollapse: () => void
  onExpand: () => void
  open: boolean
  onClose: () => void
  onOpen: () => void
  value: Item
  /** @beta */
  inputProps: Omit<ObjectInputProps, 'renderDefault'>
}

/** @public */
export type ItemProps =
  | ObjectItemProps
  | ObjectItemProps<CrossDatasetReferenceValue & ObjectItem>
  | ObjectItemProps<FileValue & ObjectItem>
  | ObjectItemProps<GeopointValue & ObjectItem>
  | ObjectItemProps<ImageValue & ObjectItem>
  | ObjectItemProps<ReferenceValue & ObjectItem>
  | ObjectItemProps<SlugValue & ObjectItem>
  | PrimitiveItemProps

/** @public */
export interface PrimitiveItemProps extends BaseItemProps<string | number | boolean> {
  value: string | number | boolean
  schemaType: NumberSchemaType | BooleanSchemaType | StringSchemaType
  parentSchemaType: ArraySchemaType
}
