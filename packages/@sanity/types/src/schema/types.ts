// Note: INCOMPLETE, but it's a start
import type {ComponentType} from 'react'
import type {Rule} from '../validation'
import type {ReferenceOptions} from '../reference'
import type {AssetSource} from '../assets'
import type {SlugOptions} from '../slug'
import type {SanityDocument} from '../documents'
import type {CurrentUser} from '../user'
import type {PreviewConfig} from './preview'

export interface Schema {
  name: string
  get: (name: string) => SchemaType
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

export type SortOrdering = {
  title: string
  name: string
  by: {
    field: string
    direction: 'asc' | 'desc'
  }
}
export interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: SanityDocument
  currentUser: Omit<CurrentUser, 'role'>
  value: unknown
}

export type ConditionalPropertyCallback = (context: ConditionalPropertyCallbackContext) => boolean
export type ConditionalProperty = boolean | ConditionalPropertyCallback | undefined

export type InitialValueParams = Record<string, unknown>
export type InitialValueResolver<T> = (params?: InitialValueParams) => Promise<T> | T
export type InitialValueProperty<T = unknown> = T | InitialValueResolver<T> | undefined

/**
 * Represents the possible values of a schema type's `validation` field.
 *
 * If the schema has not been run through `inferFromSchema` from
 * `@sanity/validation` then value could be a function.
 *
 * `inferFromSchema` mutates the schema converts this value to an array of
 * `Rule` instances.
 *
 * @privateRemarks
 *
 * Usage of the schema inside the studio will almost always be from the compiled
 * `createSchema` function. In this case, you can cast the value or throw to
 * narrow the type. E.g.:
 *
 * ```ts
 * if (typeof type.validation === 'function') {
 *   throw new Error(
 *     `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
 *   )
 * }
 * ```
 */
export type SchemaValidationValue =
  | false
  | undefined
  | Rule
  | SchemaValidationValue[]
  | ((rule: Rule) => SchemaValidationValue)

export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
  liveEdit?: boolean
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
  icon?: ComponentType
  initialValue?: InitialValueProperty
  options?: Record<string, any>
  validation?: SchemaValidationValue
  preview?: PreviewConfig

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

// Note: this would ideally be a type parameter in `ArraySchemaType` however
// adding one conflicts with the existing definition.
type ArraySchemaTypeOf<TSchemaType extends ArraySchemaType['of'][number]> = Omit<
  ArraySchemaType,
  'of'
> & {of: TSchemaType[]}

/**
 * A specific `ObjectField` for `marks` in `SpanSchemaType`
 * @see SpanSchemaType
 */
export type MarksObjectField = {name: 'marks'} & ObjectField<ArraySchemaTypeOf<StringSchemaType>>

/**
 * A specific `ObjectField` for `text` in `SpanSchemaType`
 * @see SpanSchemaType
 */
export type TextObjectField = {name: 'text'} & ObjectField<TextSchemaType>

/**
 * A specific `ObjectField` for `style` in `BlockSchemaType`
 * @see BlockSchemaType
 */
export type StyleObjectField = {name: 'style'} & ObjectField<StringSchemaType>

/**
 * A specific `ObjectField` for `list` in `BlockSchemaType`
 * @see BlockSchemaType
 */
export type ListObjectField = {name: 'list'} & ObjectField<StringSchemaType>

/**
 * A specific `ObjectField` for span `children` in `BlockSchemaType`
 * @see BlockSchemaType
 */
export type SpanChildrenObjectField = {name: 'children'} & ObjectField<ArraySchemaType>

/**
 * Represents the compiled schema shape for `span`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 */
export interface SpanSchemaType extends Omit<ObjectSchemaType, 'fields'> {
  annotations: SchemaType[]
  decorators: TitledListValue<string>[]
  // the first field will always be the `marks` field and the second will
  // always be the `text` field
  fields: [MarksObjectField, TextObjectField]
}

/**
 * Represents the compiled schema shape for `block`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 */
export interface BlockSchemaType extends ObjectSchemaType {
  fields: [
    // the first 3 field are always span children, styles, and lists
    SpanChildrenObjectField,
    StyleObjectField,
    ListObjectField,
    // then it could be any additional fields the user could add
    ...ObjectField[]
  ]
}

export interface SlugSchemaType extends BaseSchemaType {
  jsonType: 'object'
  options?: SlugOptions
}

export type ObjectFieldType<T extends SchemaType = SchemaType> = T & {
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
}

export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  group?: string | string[]
  type: ObjectFieldType<T>
}
export interface FieldGroup {
  name: string
  icon?: React.ComponentType
  title?: string
  description?: string
  hidden?: ConditionalProperty
  default?: boolean
  fields?: ObjectField[]
}

export interface ObjectSchemaType extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  groups?: FieldGroup[]
  fieldsets?: Fieldset[]
  initialValue?: InitialValueProperty<Record<string, unknown>>
  weak?: boolean

  // Experimentals
  // Note: `path` is a string in the _specification_, but converted to a
  // string array in the schema normalization/compilation step
  // eslint-disable-next-line camelcase
  __experimental_search: {path: string[]; weight: number; mapWith?: string}[]
}

export interface ObjectSchemaTypeWithOptions extends ObjectSchemaType {
  options?: CollapseOptions & {
    columns?: number
  }
}

export interface SingleFieldSet {
  single: true
  field: ObjectField
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  group?: string | string[]
}

export interface MultiFieldSet {
  name: string
  title?: string
  description?: string
  single?: false
  group?: string | string[]
  options?: CollapseOptions & {
    columns?: number
  }
  fields: ObjectField[]
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
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
  to: ObjectSchemaType[]
  weak?: boolean
  options?: ReferenceOptions
}

export interface AssetSchemaTypeOptions {
  accept?: string
  storeOriginalFilename?: boolean
}

export interface FileSchemaType extends ObjectSchemaType {
  options?: AssetSchemaTypeOptions & {
    sources?: AssetSource[]
  }
}

export interface ImageSchemaType extends ObjectSchemaType {
  options?: AssetSchemaTypeOptions & {
    hotspot?: boolean
    metadata?: ('exif' | 'location' | 'lqip' | 'palette' | 'blurhash')[]
    sources?: AssetSource[]
  }
}

export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
