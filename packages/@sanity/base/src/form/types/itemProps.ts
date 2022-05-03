import {
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'

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

export interface ItemOfObject extends BaseItem {
  schemaType: ObjectSchemaType
  collapsed: boolean | undefined
  collapsible: boolean
  onSetCollapsed: (collapsed: boolean) => void
}

export interface ItemOfNumber extends BaseItem {
  schemaType: NumberSchemaType
}
export interface ItemOfBoolean extends BaseItem {
  schemaType: BooleanSchemaType
}
export interface ItemOfString extends BaseItem {
  schemaType: StringSchemaType
}

export type ItemProps = ItemOfObject | ItemOfNumber | ItemOfBoolean | ItemOfString
