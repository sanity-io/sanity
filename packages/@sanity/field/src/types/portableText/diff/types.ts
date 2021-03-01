import {ObjectDiff} from '../../../diff'
import {SchemaType, ObjectSchemaType} from '../../../types'

export type PortableTextBlock = {
  _key: string
  _type: string
  children: PortableTextChild[]
  markDefs?: {_key: string; _type: string}[]
  style?: string
}

export type PortableTextChild = {
  _key: string
  _type: string
  marks?: string[]
  text?: string
}

export type SpanTypeSchema = SchemaType & {
  decorators?: {title: string; value: string}[]
  annotations?: ObjectSchemaType[]
}

export type PortableTextDiff = ObjectDiff & {displayValue: PortableTextBlock; origin: ObjectDiff}

export type MarkSymbolMap = Record<string, string[]>

export type InlineSymbolMap = Record<string, string>
