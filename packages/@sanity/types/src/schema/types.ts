// Note: INCOMPLETE, but it's a start

import {SlugOptions} from '../slug'

export interface Schema {
  name: string
  get: (name: string) => SchemaType
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
}

export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: {
    list?: {title?: string; value: string}[]
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'

    // Actually just part of date time, but can't find a good way to differentiate
    dateFormat?: string
    timeFormat?: string
  }
}

export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
}

export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: {
    layout: 'checkbox' | 'switch'
  }
}

export interface ArraySchemaType extends BaseSchemaType {
  jsonType: 'array'
  of: Exclude<SchemaType, ArraySchemaType>[]
}

export interface BlockSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  name: 'block'
  of?: SchemaType[]
}

export interface SlugSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  options?: SlugOptions
}

export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  type: T
}

export interface ObjectSchemaType extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  fieldsets?: Fieldset[]
}

export interface SingleFieldSet {
  single: true
  field: ObjectField
}

export interface MultiFieldSet {
  name: string
  title?: string
  description?: string
  single?: false
  options?: {
    collapsible?: boolean
    collapsed?: boolean
    columns?: number
  }
  fields: ObjectField[]
}

export type Fieldset = SingleFieldSet | MultiFieldSet

export interface ReferenceSchemaType extends ObjectSchemaType {
  to: SchemaType[]
}

export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
