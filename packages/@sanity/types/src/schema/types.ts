import type {ComponentType} from 'react'
import {SanityClient} from '@sanity/client'
import type {Rule} from '../validation'
import type {SanityDocument} from '../documents'
import type {CurrentUser} from '../user'
import type {PreviewConfig} from './preview'
import {SchemaTypeDefinition} from './definition/schemaDefinition'
import {ArrayOptions} from './definition/type/array'
import {
  BlockOptions,
  BooleanOptions,
  DateOptions,
  DatetimeOptions,
  FileOptions,
  ImageOptions,
  NumberOptions,
  ReferenceOptions,
  SlugOptions,
  StringOptions,
  TextOptions,
} from './definition/type'
import {TitledListValue} from './definition/type/common'

export {defineType, defineField, defineArrayMember, typed} from './define'

/**
 * Note: you probably want `SchemaTypeDefinition` instead
 * @see SchemaTypeDefinition
 */
export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | FileSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
  | ReferenceSchemaType

export interface SchemaValidationError {
  helpId?: string
  message: string
  severity: 'error'
}

export interface SchemaValidationWarning {
  helpId?: string
  message: string
  severity: 'warning'
}

export type SchemaValidationProblem = SchemaValidationError | SchemaValidationWarning

export type SchemaValidationProblemPath = Array<
  {kind: 'type'; type: string; name: string} | {kind: 'property'; name: string}
>

export interface SchemaValidationProblemGroup {
  path: SchemaValidationProblemPath
  problems: SchemaValidationProblem[]
}

export interface Schema {
  _original?: {
    name: string
    types: SchemaTypeDefinition[]
  }
  _registry: {[typeName: string]: any}
  _validation?: SchemaValidationProblemGroup[]
  name: string
  get: (name: string) => SchemaType | undefined
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

export interface SortOrderingItem {
  field: string
  direction: 'asc' | 'desc'
}

export type SortOrdering = {
  title: string
  name: string
  by: SortOrderingItem[]
}
export interface ConditionalPropertyCallbackContext {
  document: SanityDocument | undefined
  // `any` should be fine here. leaving this as `unknown` would cause more
  // friction for end users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  currentUser: Omit<CurrentUser, 'role'> | null
}

export type ConditionalPropertyCallback = (context: ConditionalPropertyCallbackContext) => boolean
export type ConditionalProperty = boolean | ConditionalPropertyCallback | undefined

export interface InitialValueResolverContext {
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  getClient: (options: {apiVersion: string}) => SanityClient
}

export type InitialValueResolver<Params, Value> = (
  params: Params | undefined,
  context: InitialValueResolverContext
) => Promise<Value> | Value

export type InitialValueProperty<Params, Value> =
  | Value
  | InitialValueResolver<Params, Value>
  | undefined

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
  initialValue?: InitialValueProperty<any, any>
  validation?: SchemaValidationValue
  preview?: PreviewConfig
  components?: {
    diff?: ComponentType<any> // @todo: use `DiffProps` here
    field?: ComponentType<any> // @todo: use `FieldProps` here
    input?: ComponentType<any> // @todo: use `InputProps` here
    item?: ComponentType<any> // @todo: use `ItemProps` here
    preview?: ComponentType<any> // @todo: use `PreviewProps` here
  }

  /**
   * @deprecated This will be removed.
   */
  placeholder?: string
}

/**
 * This is used for string, text, date and datetime.
 * This interface represent the compiled version at runtime, when accessed through Schema.
 */
export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: StringOptions & TextOptions & DateOptions & DatetimeOptions
  initialValue?: InitialValueProperty<any, string>
}

export interface TextSchemaType extends StringSchemaType {
  rows?: number
}

export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
  options?: NumberOptions
  initialValue?: InitialValueProperty<any, number>
}

export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: BooleanOptions
  initialValue?: InitialValueProperty<any, boolean>
}

export interface ArraySchemaType<V = unknown> extends BaseSchemaType {
  jsonType: 'array'
  of: (Exclude<SchemaType, ArraySchemaType> | ReferenceSchemaType)[]
  options?: ArrayOptions<V> & {layout?: V extends string ? 'tag' : 'grid'}
}

// Note: this would ideally be a type parameter in `ArraySchemaType` however
// adding one conflicts with the existing definition.
export type ArraySchemaTypeOf<TSchemaType extends ArraySchemaType['of'][number]> = Omit<
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
 * The specific `children` field of a `block` type (`BlockSchemaType`)
 * @see BlockSchemaType
 */
export type BlockChildrenObjectField = {name: 'children'} & ObjectField<ArraySchemaType>

/**
 * Represents the compiled schema shape for `span`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 */
export interface SpanSchemaType extends Omit<ObjectSchemaType, 'fields'> {
  annotations: (ObjectSchemaType & {
    blockEditor?: {
      icon?: string | ComponentType
      render?: ComponentType
    }
  })[]
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
    // the first 3 field are always block children, styles, and lists
    BlockChildrenObjectField,
    StyleObjectField,
    ListObjectField,
    // then it could be any additional fields the user could add
    ...ObjectField[]
  ]
  options?: BlockOptions
}

export interface SlugSchemaType extends ObjectSchemaType {
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
  icon?: ComponentType
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
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
  weak?: boolean

  // Experimentals
  // Note: `path` is a string in the _specification_, but converted to a
  // string array in the schema normalization/compilation step
  // eslint-disable-next-line camelcase
  __experimental_search?: {path: string[]; weight: number; mapWith?: string}[]

  /**
   * @beta
   */
  orderings?: SortOrdering[]

  // @todo
  options?: any
}

export interface ObjectSchemaTypeWithOptions extends Omit<ObjectSchemaType, 'options'> {
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
  collapsed?: boolean

  collapsible?: boolean

  /**
   * @deprecated Use `collapsible` instead
   */
  collapsable?: boolean
}

export interface ReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: ObjectSchemaType[]
  weak?: boolean
  options?: ReferenceOptions
}

export interface AssetSchemaTypeOptions {
  accept?: string
  storeOriginalFilename?: boolean
}

export interface FileSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: FileOptions
}

export interface ImageSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: ImageOptions
}
