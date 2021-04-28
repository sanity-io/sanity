// Note: INCOMPLETE, but it's a start
import React from 'react'
import {ReferenceOptions} from '../reference'
import {AssetSource} from '../assets'
import {SlugOptions} from '../slug'

export interface Schema {
  name: string
  get: (name: string) => SchemaType
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

export interface PreviewValue {
  title?: string
  subtitle?: string
  description?: string
  media?: string
}

export interface PrepareViewOptions {
  ordering?: SortOrdering
}

export type SortOrdering = {
  title: string
  name: string
  by: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export type InitialValueParams = Record<string, unknown>
export type InitialValueResolver<T> = (params?: InitialValueParams) => Promise<T> | T
export type InitialValueProperty<T = unknown> = T | InitialValueResolver<T> | undefined

export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
  readOnly?: boolean
  liveEdit?: boolean
  icon?: React.ComponentType
  initialValue?: InitialValueProperty
  options?: unknown

  preview?: {
    select?: PreviewValue
    prepare: (
      value: {
        title?: unknown
        subtitle?: unknown
        description?: unknown
        media?: unknown
      },
      viewOptions?: PrepareViewOptions
    ) => PreviewValue
  }

  /**
   * @deprecated
   */
  placeholder?: string
}

export interface TitledListValue<V = unknown> {
  _key?: string
  title: string
  value: V
}

interface EnumListProps<V = unknown> {
  list?: TitledListValue<V>[] | V[]
  layout?: 'radio' | 'dropdown'
  direction?: 'horizontal' | 'vertical'
}

export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: EnumListProps<string> & {
    // Actually just part of date time, but can't find a good way to differentiate
    dateFormat?: string
    timeFormat?: string
  }
  initialValue?: ((arg?: any) => Promise<string> | string) | string | undefined
}

export interface TextSchemaType extends StringSchemaType {
  rows?: number
}

export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
  options?: EnumListProps<number>
  initialValue?: InitialValueProperty<number>
}

export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: {
    layout: 'checkbox' | 'switch'
  }
  initialValue?: InitialValueProperty<boolean>
}

export interface ArraySchemaType<V = unknown> extends BaseSchemaType {
  jsonType: 'array'
  of: (Exclude<SchemaType, ArraySchemaType> | ReferenceSchemaType)[]
  options?: {
    list?: TitledListValue<V>[] | V[]
    layout?: V extends string ? 'tags' : 'grid'
    direction?: 'horizontal' | 'vertical'
    sortable?: boolean

    /**
     * @deprecated
     */
    editModal?: 'dialog' | 'fullscreen' | 'popover' | 'fold'
  }
}

export interface BlockSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  name: 'block'
  of?: SchemaType[]
}

export interface SlugSchemaType extends BaseSchemaType {
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
  initialValue?: InitialValueProperty<Record<string, unknown>>

  // Experimentals
  /* eslint-disable camelcase */
  __experimental_search?: {path: string; weight: number}[]
  /* eslint-enable camelcase */
}

export interface ObjectSchemaTypeWithOptions extends ObjectSchemaType {
  options?: CollapseOptions & {
    columns?: number
  }
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
  options?: CollapseOptions & {
    columns?: number
  }
  fields: ObjectField[]
}

export type Fieldset = SingleFieldSet | MultiFieldSet

export interface CollapseOptions {
  collapsable?: boolean
  collapsed?: boolean

  /**
   * @deprecated Use `collapsable`/`collapsed`
   */
  collapsible?: boolean
}

export interface ReferenceSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  to: SchemaType[]
  weak?: boolean
  options?: ReferenceOptions
}

export interface AssetSchemaTypeOptions {
  accept?: string
  storeOriginalFilename?: boolean
}

export interface FileSchemaType extends ObjectSchemaType {
  options?: AssetSchemaTypeOptions
}

export interface ImageSchemaType extends ObjectSchemaType {
  options?: AssetSchemaTypeOptions & {
    hotspot?: boolean
    metadata?: ('exif' | 'location' | 'lqip' | 'palette')[]
    sources?: AssetSource[]
  }
}

export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
