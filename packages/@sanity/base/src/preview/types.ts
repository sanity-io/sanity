import {SchemaType} from '@sanity/types'

export type Id = string

export type Reference = {_ref: string; [key: string]: unknown}
export type Document = {_id: string; [key: string]: unknown}

export type Value = Document | Reference | unknown

export type FieldName = string

export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export {PrepareViewOptions} from '@sanity/types'
export {SortOrdering} from '@sanity/types'

export type PreviewConfig = {
  select: {
    title: string
    subtitle: string
    description: string
  }
}
export type Type = SchemaType
