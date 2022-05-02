import {ObjectSchemaType, Path} from '@sanity/types'
import {BooleanInputProps, NumberInputProps, ObjectInputProps, StringInputProps} from './inputProps'

interface BaseItem {
  schemaType: ObjectSchemaType
  value: unknown
  path: Path
  key: string
  index: number
}

interface ItemOfObject extends BaseItem {
  schemaType: ObjectSchemaType
  collapsed: boolean
  collapsible: boolean
  inputProps: ObjectInputProps
}

interface ItemOfNumber extends BaseItem {
  inputProps: NumberInputProps
}
interface ItemOfBoolean extends BaseItem {
  inputProps: BooleanInputProps
}

interface ItemOfString extends BaseItem {
  inputProps: StringInputProps
}

export type Item = ItemOfObject | ItemOfNumber | ItemOfBoolean | ItemOfString
