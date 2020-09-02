import {ArrayDiff, ObjectDiff} from '../../index'
import {ReactNode} from 'react'
import {SchemaType} from '../../types'

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

export type ChildMap = Record<
  string,
  {
    annotation: ReactNode | undefined
    child: PortableTextChild
    diffs: ObjectDiff[] | ArrayDiff[]
    summary: ReactNode[]
    schemaType?: SchemaType // May be removed from the PT schema (but data remains referring to removed types)
  }
>

export type SpanTypeSchema = SchemaType & {decorators?: {title: string; value: string}[]}
