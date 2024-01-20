import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Reference,
  type ReferenceSchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {type ComponentType} from 'react'

import {type UserColor} from '../../user-color'

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
