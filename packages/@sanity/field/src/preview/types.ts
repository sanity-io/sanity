import {ComponentType} from 'react'
import {Reference} from '@sanity/types'
import {UserColor} from '@sanity/base/__legacy/user-color'
import {
  ArraySchemaType,
  BooleanSchemaType,
  StringSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  ReferenceSchemaType,
} from '../diff'

export type PreviewComponent<T> = ComponentType<{
  color?: UserColor
  schemaType: T extends Array<any>
    ? ArraySchemaType
    : T extends boolean
    ? BooleanSchemaType
    : T extends string
    ? StringSchemaType
    : T extends number
    ? NumberSchemaType
    : T extends Reference
    ? ReferenceSchemaType
    : T extends Record<string, any>
    ? ObjectSchemaType
    : any
  value: T
}>
