import {ArraySchemaType, ObjectSchemaType} from '@sanity/types'
import React from 'react'
import type {Type as SchemaType} from './schema'

export type PortableTextBlock = {
  _type: string
  _key: string
  [other: string]: any
}

export interface TextBlock {
  _type: string
  _key: string
  children: PortableTextChild[]
  markDefs: MarkDef[]
  listItem?: string
  style?: string
  level?: number
}

export interface ListItem extends TextBlock {
  listItem: string
  level: number
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
    icon?: string | React.ElementType
    render?: React.ElementType
  }
  portableText?: {
    icon?: string | React.ElementType
    render?: React.ElementType
  }
  type: SchemaType
}

export type PortableTextFeatures = {
  decorators: PortableTextFeature[]
  styles: PortableTextFeature[]
  annotations: PortableTextFeature[]
  lists: PortableTextFeature[]
  types: {
    block: ObjectSchemaType
    blockObjects: ObjectSchemaType[]
    inlineObjects: ObjectSchemaType[]
    portableText: ArraySchemaType<PortableTextBlock>
    span: ObjectSchemaType
    annotations: ObjectSchemaType[]
  }
}
