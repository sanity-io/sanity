import {ComponentType} from 'react'
import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Reference,
  ReferenceSchemaType,
  StringSchemaType,
} from '@sanity/types'
import {UserColor} from '../../user-color'

/** @internal */
export type FieldPreviewComponent<T = any> = ComponentType<{
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
    : T extends object
    ? ObjectSchemaType
    : any
  value: T
}>
