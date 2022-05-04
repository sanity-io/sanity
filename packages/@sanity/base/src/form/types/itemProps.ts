import {
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'

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
  onRemove: () => void

  // --- todo, potentially
  // onMoveTo: (event: {ref: number|string, position: 'before'|'after'}) => void
  // onDuplicate: () => void
  // ---
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void

  children: React.ReactNode | null
}

export interface ObjectItemProps extends BaseItemProps {
  schemaType: ObjectSchemaType
  collapsed: boolean | undefined
  collapsible: boolean
  focused?: boolean
  onSetCollapsed: (collapsed: boolean) => void
}

export interface NumberItemProps extends BaseItemProps {
  schemaType: NumberSchemaType
}
export interface BooleanItemProps extends BaseItemProps {
  schemaType: BooleanSchemaType
}
export interface StringItemProps extends BaseItemProps {
  schemaType: StringSchemaType
}

export type ItemProps = ObjectItemProps | NumberItemProps | BooleanItemProps | StringItemProps
