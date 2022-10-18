import {
  ArraySchemaType,
  BooleanSchemaType,
  FormNodeValidation,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {FormNodePresence} from '../../presence'
import {ObjectInputProps} from './inputProps'

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
  onInsert: (event: {items: T[]; position: 'before' | 'after'}) => void

  children: React.ReactNode

  validation: FormNodeValidation[]

  /** @beta */
  presence: FormNodePresence[]

  renderDefault: (props: ItemProps) => React.ReactElement
}

export interface ObjectItemProps<Item extends ObjectItem = ObjectItem> extends BaseItemProps<Item> {
  changed: boolean
  schemaType: ObjectSchemaType
  parentSchemaType: ArraySchemaType
  collapsed: boolean | undefined
  collapsible: boolean
  onCollapse: () => void
  onExpand: () => void
  open: boolean
  onClose: () => void
  onOpen: () => void
  value: Item
  inputProps: Omit<ObjectInputProps, 'renderDefault'>
}

export type ItemProps = ObjectItemProps | PrimitiveItemProps

export interface PrimitiveItemProps extends BaseItemProps<string | number | boolean> {
  value: string | number | boolean
  schemaType: NumberSchemaType | BooleanSchemaType | StringSchemaType
  parentSchemaType: ArraySchemaType
}
