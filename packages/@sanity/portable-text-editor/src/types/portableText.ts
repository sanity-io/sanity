import type {ComponentType} from 'react'
import type {Type as SchemaType} from './schema'

export type PortableTextBlock = {
  _type: string
  _key: string
  [other: string]: any
}

export type TextBlock = {
  _type: string
  _key: string
  children: PortableTextChild[]
  markDefs: MarkDef[]
}

export type TextSpan = {
  _key: string
  _type: 'span'
  text: string
  marks: string[]
}

export type PortableTextChild =
  | {
      _key: string
      _type: string
      [other: string]: any
    }
  | TextSpan

export type MarkDef = {_key: string; _type: string}

export type PortableTextFeature = {
  title: string
  value: string
  // Backward compatibility (blockEditor)
  blockEditor?: {
    icon?: string | ComponentType<any>
    render?: ComponentType<any>
  }
  portableText?: {
    icon?: string | ComponentType<any>
    render?: ComponentType<any>
  }
  type: SchemaType
}

export type PortableTextFeatures = {
  decorators: PortableTextFeature[]
  styles: PortableTextFeature[]
  annotations: PortableTextFeature[]
  lists: PortableTextFeature[]
  types: {
    block: SchemaType
    blockObjects: SchemaType[]
    inlineObjects: SchemaType[]
    portableText: SchemaType
    span: SchemaType
    annotations: SchemaType[]
  }
}
