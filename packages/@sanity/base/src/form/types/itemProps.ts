import {
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'

export interface BaseItem {
  schemaType: SchemaType
  key: string
  index: number
  level: number
  value: unknown
  path: Path
  title: string | undefined
  description: string | undefined
  inputId: string
  children: React.ReactNode | null
}

export interface ObjectItemProps extends BaseItem {
  schemaType: ObjectSchemaType
  collapsed: boolean | undefined
  collapsible: boolean
  onSetCollapsed: (collapsed: boolean) => void
}

export interface NumberItemProps extends BaseItem {
  schemaType: NumberSchemaType
}
export interface BooleanItemProps extends BaseItem {
  schemaType: BooleanSchemaType
}
export interface StringItemProps extends BaseItem {
  schemaType: StringSchemaType
}

export type ItemProps = ObjectItemProps | NumberItemProps | BooleanItemProps | StringItemProps
