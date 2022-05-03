import {ObjectSchemaType, Path} from '@sanity/types'

interface BaseItem {
  schemaType: ObjectSchemaType
  value: unknown
  path: Path
  key: string
  index: number
  children: React.ReactNode
}

interface ItemOfObject extends BaseItem {
  schemaType: ObjectSchemaType
  collapsed: boolean
  collapsible: boolean
}

interface ItemOfNumber extends BaseItem {}
interface ItemOfBoolean extends BaseItem {}
interface ItemOfString extends BaseItem {}

export type Item = ItemOfObject | ItemOfNumber | ItemOfBoolean | ItemOfString
