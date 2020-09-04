import {ArrayDiff, ObjectDiff} from '../../../diff'
import {SchemaType} from '../../../types'

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

export type SpanTypeSchema = SchemaType & {decorators?: {title: string; value: string}[]}

export type ChildMap = Record<
  string,
  {
    child: PortableTextChild
    diff: ObjectDiff | ArrayDiff
    summary: string[]
    schemaType?: SchemaType // May be removed from the PT schema (but data remains referring to removed types)
  }
>
