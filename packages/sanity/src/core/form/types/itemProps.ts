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

/**
 * Props for the base item component.
 *
 * @public
 */
export interface BaseItemProps<T> {
  /** The schema type of the item. */
  schemaType: SchemaType
  /** The key of the item. */
  key: string
  /** The index of the item. */
  index: number
  /** The level of the item. */
  level: number
  /** The value of the item. */
  value: unknown
  /** The path of the item. */
  path: Path
  /** The title of the item. */
  title: string | undefined
  /** The description of the item. */
  description: string | undefined
  /** The ID of the input element. */
  inputId: string
  /** The function to call when the item receives focus. */
  onFocus: (event: React.FocusEvent) => void
  /** The function to call when the item loses focus. */
  onBlur: (event: React.FocusEvent) => void
  /** Whether the item is read-only. */
  readOnly?: boolean
  /** Whether the item is focused. */
  focused?: boolean
  /** The function to call when the item is removed. */
  onRemove: () => void

  // --- todo, potentially
  // onMoveTo: (event: {ref: number|string, position: 'before'|'after'}) => void
  // onDuplicate: () => void
  // ---
  /**
   * @hidden
   * @beta */
  onInsert: (event: Omit<ArrayInputInsertEvent<T>, 'referenceItem'>) => void

  /** The children of the item. */
  children: React.ReactNode

  /** The validation markers for the item. */
  validation: FormNodeValidation[]

  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]

  /** The function to call to render the default item. See {@link ItemProps} */
  renderDefault: (props: ItemProps) => React.ReactElement
}

/**
 * Props for the ObjectItem component.
 * @public
 */
export interface ObjectItemProps<Item extends ObjectItem = ObjectItem> extends BaseItemProps<Item> {
  /** Whether the item has changes in a draft. */
  changed: boolean
  /** The schema type of the object. */
  schemaType: ObjectSchemaType
  /** The schema type of the parent array. */
  parentSchemaType: ArraySchemaType
  /** Whether the item is collapsed. */
  collapsed: boolean | undefined
  /** Whether the item is collapsible. */
  collapsible: boolean | undefined
  /** Callback for when the item is collapsed. */
  onCollapse: () => void
  /** Callback for when the item is expanded. */
  onExpand: () => void
  /** Whether the item is open. */
  open: boolean
  /** Callback for when the item is closed. */
  onClose: () => void
  /** Callback for when the item is opened. */
  onOpen: () => void
  /** The value of the item. */
  value: Item
  /**
   * @hidden
   * @beta */
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
  /**
   * The value of the primitive item.
   */
  value: string | number | boolean
  /**
   * The schema type of the primitive item.
   */
  schemaType: NumberSchemaType | BooleanSchemaType | StringSchemaType
  /**
   * The schema type of the parent array containing the item.
   */
  parentSchemaType: ArraySchemaType
}
