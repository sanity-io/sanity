import {ArraySchemaType} from '@sanity/types'

export type Type = {
  type: Type
  name: string
  title: string
  description?: string
  readOnly?: boolean
  of: ArraySchemaType['of']
  options: Record<string, any> | null
  fields?: Type[]
  [prop: string]: any
  jsonType: 'array'
}

export type PortableTextType = Type & {
  options?: {
    modal?: {type?: 'dialog' | 'popover'; width?: number | number[] | 'auto'}
    sortable?: boolean
    layout?: 'grid'
  }
  styles?: {title: string; value: string}[]
}

export type RawType = {
  type: string
  name: string
  title?: string
  description?: string
  readOnly?: boolean
  of?: Type[] | RawType[]
  options?: Record<string, any> | null
  fields?: Type[] | RawType[]
  [prop: string]: any
}
