import {
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {NodePresence, NodeValidation} from './common'

export interface BaseItemProps {
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
  readOnly?: boolean
  focused?: boolean
  onRemove: () => void

  // --- todo, potentially
  // onMoveTo: (event: {ref: number|string, position: 'before'|'after'}) => void
  // onDuplicate: () => void
  // ---
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void

  children: React.ReactNode | null

  validation: NodeValidation[]
  presence: NodePresence[]
}

export interface ObjectItemProps extends BaseItemProps {
  changed: boolean
  schemaType: ObjectSchemaType
  collapsed: boolean | undefined
  collapsible: boolean
  onCollapse: () => void
  onExpand: () => void
  open: boolean
  onClose: () => void
  onOpen: () => void
}

export type ItemProps = ObjectItemProps | PrimitiveItemProps

export interface PrimitiveItemProps extends BaseItemProps {
  schemaType: NumberSchemaType | BooleanSchemaType | StringSchemaType
}
